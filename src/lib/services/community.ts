import "server-only";
import { db } from "../db";
import { ConflictError, NotFoundError } from "../errors";
import { formatDateTime } from "../format";
import { sendMail } from "../mail";
import { siteUrl } from "../site";
import { audit, type Actor } from "./audit";
import { getSiteSettingsSafe } from "./admin-data";

// Tương tác từ trang công khai: báo chủ nuôi khi có người quét, người nhặt gửi vị trí,
// lời nhắn trong sổ lưu bút tưởng niệm.

const SCAN_NOTIFY_GAP_MS = 30 * 60 * 1000; // tối đa một email mỗi 30 phút cho mỗi bé

/** Người nhận thông báo: email chủ nuôi, nếu không có thì email liên hệ của Furever. */
async function recipientFor(ownerEmail: string | null): Promise<string | null> {
  if (ownerEmail) return ownerEmail;
  const s = await getSiteSettingsSafe();
  return s.contact_email || null;
}

export type ScanContext = { city?: string | null; region?: string | null; country?: string | null };

function placeText(ctx: ScanContext): string | null {
  const parts = [ctx.city, ctx.region].filter(Boolean);
  if (!parts.length) return null;
  return parts.join(", ") + (ctx.country && ctx.country !== "VN" ? ` (${ctx.country})` : "");
}

/** Gửi email khi mã của bé đang sống được quét, giới hạn 30 phút một lần. */
export async function notifyScan(petId: string, ctx: ScanContext) {
  const pet = await db.pet.findUnique({
    where: { id: petId },
    select: { name: true, lifeStatus: true, owner: { select: { email: true, notifyScan: true } } },
  });
  if (!pet || pet.lifeStatus !== "alive" || !pet.owner.email || !pet.owner.notifyScan) return;
  // Đặt mốc trước khi gửi, có điều kiện, để hai lượt quét cùng lúc không gửi hai email.
  const claimed = await db.pet.updateMany({
    where: {
      id: petId,
      OR: [{ lastScanNotifiedAt: null }, { lastScanNotifiedAt: { lt: new Date(Date.now() - SCAN_NOTIFY_GAP_MS) } }],
    },
    data: { lastScanNotifiedAt: new Date() },
  });
  if (claimed.count === 0) return;
  const place = placeText(ctx);
  await sendMail({
    to: pet.owner.email,
    subject: `Có người vừa quét mã vòng cổ của ${pet.name}`,
    text:
      `Mã QR trên vòng cổ của ${pet.name} vừa được quét lúc ${formatDateTime(new Date())}` +
      (place ? `, ở khu vực ${place} (ước tính theo mạng của người quét, không chính xác tuyệt đối)` : "") +
      `.\n\nNếu bé đang ở nhà với bạn, có thể ai đó chỉ tò mò quét thử. Nếu bé đi lạc, hãy để ý điện thoại: người nhặt được bé có thể gọi hoặc gửi vị trí cho bạn.\n\n` +
      `Xem lượt quét và vị trí được gửi: ${siteUrl()}/chu-nuoi/${petId}\n\n` +
      `Không muốn nhận email này nữa? Tắt trong trang chủ nuôi ở cùng đường dẫn trên.`,
  });
}

// ---------- Người nhặt gửi vị trí ----------

export type FoundReportInput = {
  latitude?: number | null;
  longitude?: number | null;
  accuracyM?: number | null;
  message?: string | null;
  finderContact?: string | null;
};

const REPORTS_PER_HOUR = 5;

export async function createFoundReport(
  target: { petId: string; qrTagId: string },
  input: FoundReportInput,
  ipHash: string,
) {
  const hasLocation = input.latitude != null && input.longitude != null;
  if (!hasLocation && !input.message && !input.finderContact) {
    throw new ConflictError("Hãy chia sẻ vị trí hoặc để lại lời nhắn");
  }
  const recent = await db.foundReport.count({
    where: { ipHash, petId: target.petId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= REPORTS_PER_HOUR) throw new ConflictError("Bạn đã gửi nhiều lần, chủ nuôi đã nhận được thông tin.");

  const report = await db.foundReport.create({
    data: {
      petId: target.petId,
      qrTagId: target.qrTagId,
      latitude: hasLocation ? input.latitude : null,
      longitude: hasLocation ? input.longitude : null,
      accuracyM: hasLocation && input.accuracyM ? Math.round(input.accuracyM) : null,
      message: input.message?.trim().slice(0, 500) || null,
      finderContact: input.finderContact?.trim().slice(0, 100) || null,
      ipHash,
    },
    include: { pet: { select: { name: true, cardNo: true, owner: { select: { email: true } } } } },
  });

  const to = await recipientFor(report.pet.owner.email);
  if (to) {
    const map = hasLocation ? `https://www.google.com/maps?q=${input.latitude},${input.longitude}` : null;
    await sendMail({
      to,
      subject: `Có người báo đã thấy ${report.pet.name}`,
      text:
        `Một người vừa gửi thông tin về ${report.pet.name} (${report.pet.cardNo}) lúc ${formatDateTime(report.createdAt)}.\n\n` +
        (map
          ? `Vị trí: ${map}${report.accuracyM ? ` (sai số khoảng ${report.accuracyM} m)` : ""}\n`
          : "Người này không chia sẻ vị trí.\n") +
        (report.message ? `Lời nhắn: ${report.message}\n` : "") +
        (report.finderContact ? `Liên lạc người nhặt: ${report.finderContact}\n` : "") +
        `\nXem chi tiết: ${siteUrl()}/chu-nuoi/${target.petId}`,
    });
  }
  return report.id;
}

// ---------- Sổ lưu bút ----------

const GUESTBOOK_PER_HOUR = 3;

export async function submitGuestbookEntry(
  petId: string,
  input: { authorName: string; message: string },
  ipHash: string,
) {
  const recent = await db.guestbookEntry.count({
    where: { ipHash, petId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= GUESTBOOK_PER_HOUR) throw new ConflictError("Bạn đã gửi nhiều lời nhắn, hãy thử lại sau.");
  const entry = await db.guestbookEntry.create({
    data: { petId, authorName: input.authorName, message: input.message, ipHash },
    include: { pet: { select: { name: true, owner: { select: { email: true } } } } },
  });
  const to = await recipientFor(entry.pet.owner.email);
  if (to) {
    await sendMail({
      to,
      subject: `Lời nhắn mới cho ${entry.pet.name} đang chờ duyệt`,
      text:
        `${entry.authorName} vừa để lại lời nhắn trong sổ lưu bút của ${entry.pet.name}:\n\n"${entry.message}"\n\n` +
        `Lời nhắn chỉ hiện trên trang sau khi được duyệt: ${siteUrl()}/chu-nuoi/${petId}?tab=guestbook`,
    });
  }
  return entry.id;
}

export async function moderateGuestbookEntry(
  petId: string,
  entryId: string,
  decision: "approved" | "rejected" | "delete",
  actor: Actor,
) {
  await db.$transaction(async (tx) => {
    const entry = await tx.guestbookEntry.findFirst({ where: { id: entryId, petId } });
    if (!entry) throw new NotFoundError("Lời nhắn không tồn tại");
    if (decision === "delete") await tx.guestbookEntry.delete({ where: { id: entryId } });
    else await tx.guestbookEntry.update({ where: { id: entryId }, data: { status: decision, moderatedAt: new Date() } });
    await audit(tx, actor, "moderate", "guestbook", entryId, decision);
  });
}

export function listGuestbook(petId: string) {
  return db.guestbookEntry.findMany({ where: { petId }, orderBy: { createdAt: "desc" }, take: 200 });
}

export function listFoundReports(petId: string) {
  return db.foundReport.findMany({ where: { petId }, orderBy: { createdAt: "desc" }, take: 50 });
}

export async function recentScans(petId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [scans, count7d] = await Promise.all([
    db.scanLog.findMany({
      where: { qrTag: { petId }, scannedAt: { gte: since } },
      orderBy: { scannedAt: "desc" },
      take: 20,
      select: { scannedAt: true, result: true },
    }),
    db.scanLog.count({
      where: { qrTag: { petId }, result: "ok", scannedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);
  return { scans, count7d };
}

export async function setNotifyScan(petId: string, enabled: boolean) {
  const pet = await db.pet.findUnique({ where: { id: petId }, select: { ownerId: true } });
  if (!pet) throw new NotFoundError("Hồ sơ không tồn tại");
  await db.owner.update({ where: { id: pet.ownerId }, data: { notifyScan: enabled } });
}
