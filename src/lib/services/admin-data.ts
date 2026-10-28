import "server-only";
import type { OrderPackage, OrderStatus } from "@/generated/prisma/enums";
import { db } from "../db";
import { NotFoundError } from "../errors";
import { audit } from "./audit";

/** UC-23 */
export async function getDashboard() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [pets, activeTags, scans7d, ordersByStatus, latest] = await Promise.all([
    db.pet.count({ where: { status: "active" } }),
    db.qrTag.count({ where: { status: "active" } }),
    db.scanLog.count({ where: { scannedAt: { gte: since }, result: "ok" } }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.pet.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        cardNo: true,
        name: true,
        owner: { select: { fullName: true } },
        orders: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    }),
  ]);
  const orders = { received: 0, preparing: 0, issued: 0, delivered: 0 } as Record<OrderStatus, number>;
  for (const row of ordersByStatus) orders[row.status] = row._count._all;
  return { pets, activeTags, scans7d, orders, latest };
}

export async function nextCardNoPreview(): Promise<string> {
  const [row] = await db.$queryRaw<{ last_value: bigint; is_called: boolean }[]>`
    SELECT last_value, is_called FROM pet_card_no_seq`;
  const next = row.is_called ? row.last_value + BigInt(1) : row.last_value;
  return `PMB-${String(next).padStart(6, "0")}`;
}

export async function listQrTags(status?: "active" | "locked" | "replaced") {
  return db.qrTag.findMany({
    where: status ? { status } : undefined,
    orderBy: { issuedAt: "desc" },
    take: 100,
    include: {
      pet: { select: { id: true, cardNo: true, name: true, owner: { select: { fullName: true } } } },
      _count: { select: { scans: true } },
    },
  });
}

export async function listOrders(status?: OrderStatus) {
  return db.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      pet: { select: { id: true, cardNo: true, name: true } },
      owner: { select: { fullName: true, phone: true } },
    },
  });
}

const ORDER_STEP: Record<OrderStatus, number> = { received: 0, preparing: 1, issued: 2, delivered: 3 };

/** UC-18; chuyển lùi trạng thái được phép nhưng ghi nhật ký (A1). */
export async function updateOrder(
  orderId: string,
  input: { package: OrderPackage; status: OrderStatus; note: string | null },
  adminId: string,
) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError("Đơn hàng không tồn tại");
    const statusChanged = order.status !== input.status;
    await tx.order.update({
      where: { id: orderId },
      data: {
        package: input.package,
        status: input.status,
        note: input.note,
        ...(statusChanged ? { statusChangedAt: new Date() } : {}),
      },
    });
    const backwards = ORDER_STEP[input.status] < ORDER_STEP[order.status];
    await audit(
      tx,
      adminId,
      "update",
      "order",
      orderId,
      statusChanged ? `${order.status} -> ${input.status}${backwards ? " (lùi)" : ""}` : "details",
    );
  });
}

export const SETTING_KEYS = [
  "zalo_url",
  "messenger_url",
  "contact_email",
  "hotline",
  "facebook_url",
  "tiktok_url",
  "service_area",
] as const;
export type SiteSettings = Record<(typeof SETTING_KEYS)[number], string>;

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await db.siteSetting.findMany({ where: { key: { in: [...SETTING_KEYS] } } });
  return toSettings(rows);
}

/**
 * Dùng cho trang công khai (landing, chính sách): lỗi cơ sở dữ liệu không làm sập trang,
 * chỉ ẩn phần liên hệ và ghi log.
 */
export async function getSiteSettingsSafe(): Promise<SiteSettings> {
  try {
    return await getSiteSettings();
  } catch (e) {
    console.error("site_settings_unavailable", e);
    return toSettings([]);
  }
}

function toSettings(rows: { key: string; value: string }[]): SiteSettings {
  const out = Object.fromEntries(SETTING_KEYS.map((k) => [k, ""])) as SiteSettings;
  for (const r of rows) out[r.key as keyof SiteSettings] = r.value;
  return out;
}

export async function saveSiteSettings(values: SiteSettings, adminId: string) {
  await db.$transaction(async (tx) => {
    for (const key of SETTING_KEYS) {
      const value = values[key];
      if (value) await tx.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
      else await tx.siteSetting.deleteMany({ where: { key } });
    }
    await audit(tx, adminId, "update", "site_settings", adminId, "settings");
  });
}
