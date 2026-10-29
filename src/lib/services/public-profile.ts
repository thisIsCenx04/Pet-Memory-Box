import "server-only";
import { createHash } from "node:crypto";
import type { ScanResult } from "@/generated/prisma/enums";
import { db } from "../db";
import { isPublicTokenFormat } from "../tokens";

// UC-19 đến UC-22. Dữ liệu trả về chỉ gồm các mục đang bật: mục tắt không có trong
// object, không chỉ bị ẩn ở giao diện (FR-28, NFR-08).

export type PublicProfile = {
  cardNo: string;
  name: string;
  tagline: string | null;
  species: "dog" | "cat" | "other";
  breed: string | null;
  gender: "male" | "female" | "unknown";
  coatColor: string | null;
  traits: string | null;
  birthDate: string | null; // yyyy-mm-dd
  lifeStatus: "alive" | "memorial";
  passedDate: string | null;
  coverUrl: string | null;
  coverThumbUrl: string | null;
  note?: string;
  photos?: { url: string; thumbUrl: string | null; caption: string | null; width: number | null; height: number | null }[];
  videos?: { source: "upload" | "youtube" | "vimeo"; url: string; posterUrl: string | null; title: string | null }[];
  memories?: { title: string; date: string | null; content: string }[];
  /** Sổ lưu bút: chỉ có ở trang tưởng niệm khi được bật; chỉ gồm lời nhắn đã duyệt. */
  guestbook?: { name: string; message: string; date: string }[];
  guestbookOpen: boolean;
  contact: {
    callButton: boolean;
    phone?: string;
    phone2?: string;
    area?: string;
    address?: string;
  };
};

export type PublicLookup =
  | { result: "ok"; qrTagId: string; petId: string; profile: PublicProfile }
  | { result: Exclude<ScanResult, "ok">; qrTagId: string | null };

const dateOnly = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export async function lookupPublicProfile(token: string): Promise<PublicLookup> {
  if (!isPublicTokenFormat(token)) return { result: "not_found", qrTagId: null };

  const tag = await db.qrTag.findUnique({
    where: { token },
    include: {
      pet: {
        include: {
          owner: true,
          visibility: true,
          media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
          videos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
          memories: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
          guestbook: { where: { status: "approved" }, orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
    },
  });

  if (!tag) return { result: "not_found", qrTagId: null };
  if (tag.status === "locked") return { result: "locked", qrTagId: tag.id };
  if (tag.status === "replaced") return { result: "replaced", qrTagId: tag.id };
  const pet = tag.pet;
  if (pet.status === "archived") return { result: "archived", qrTagId: tag.id };

  // Thiếu dòng cấu hình thì dùng mặc định riêng tư nhất.
  const v = pet.visibility ?? {
    showCallButton: false,
    showPhone: false,
    showPhone2: false,
    showArea: false,
    showAddress: false,
    showNote: false,
    showMedia: false,
    showMemories: false,
    showGuestbook: false,
  };
  const { owner } = pet;
  const cover = pet.media.find((m) => m.isCover) ?? pet.media[0];

  const profile: PublicProfile = {
    cardNo: pet.cardNo,
    name: pet.name,
    tagline: pet.tagline,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    coatColor: pet.coatColor,
    traits: pet.traits,
    birthDate: dateOnly(pet.birthDate),
    lifeStatus: pet.lifeStatus,
    passedDate: dateOnly(pet.passedDate),
    coverUrl: cover?.url ?? null,
    coverThumbUrl: cover?.thumbUrl ?? null,
    contact: { callButton: v.showCallButton },
    guestbookOpen: pet.lifeStatus === "memorial" && v.showGuestbook,
  };

  if (v.showNote && pet.note) profile.note = pet.note;
  if (v.showMedia) {
    profile.photos = pet.media.map((m) => ({
      url: m.url,
      thumbUrl: m.thumbUrl,
      caption: m.caption,
      width: m.width,
      height: m.height,
    }));
    profile.videos = pet.videos.map((vd) => ({
      source: vd.source,
      url: vd.url,
      posterUrl: vd.posterUrl,
      title: vd.title,
    }));
  }
  if (v.showMemories) {
    profile.memories = pet.memories.map((m) => ({ title: m.title, date: dateOnly(m.memoryDate), content: m.content }));
  }
  if (profile.guestbookOpen) {
    profile.guestbook = pet.guestbook.map((g) => ({
      name: g.authorName,
      message: g.message,
      date: g.createdAt.toISOString(),
    }));
  }
  // Nút gọi cần số chính; số chỉ lộ ra khi nút gọi hoặc ô số điện thoại được bật.
  if (v.showCallButton || v.showPhone) profile.contact.phone = owner.phone;
  if (v.showPhone2 && owner.phone2) profile.contact.phone2 = owner.phone2;
  if (v.showArea && owner.area) profile.contact.area = owner.area;
  if (v.showAddress && owner.address) profile.contact.address = owner.address;

  return { result: "ok", qrTagId: tag.id, petId: pet.id, profile };
}

// ---------- Giới hạn tốc độ (FR-34) và ghi lượt quét (FR-33) ----------

const RATE_LIMIT_PER_MINUTE = 60;

export function clientIp(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${process.env.IP_HASH_SALT ?? ""}:${ip}`)
    .digest("hex");
}

/** Đếm lượt mở trang của IP này trong 60 giây gần nhất, dùng chung mọi instance qua cơ sở dữ liệu. */
export async function isRateLimited(ipHash: string): Promise<boolean> {
  const since = new Date(Date.now() - 60_000);
  const count = await db.scanLog.count({ where: { ipHash, scannedAt: { gte: since } } });
  return count >= RATE_LIMIT_PER_MINUTE;
}

export function shortUserAgent(ua: string | null): string | null {
  return ua ? ua.slice(0, 160) : null;
}

/** Lỗi khi ghi chỉ được log, không làm hỏng trang (UC-22 E1). */
export async function logScan(entry: {
  qrTagId: string | null;
  result: ScanResult;
  ipHash: string;
  userAgent: string | null;
}) {
  try {
    await db.scanLog.create({ data: entry });
  } catch (e) {
    console.error("scan_log_write_failed", e);
  }
}
