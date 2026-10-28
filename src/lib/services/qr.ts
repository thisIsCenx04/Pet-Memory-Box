import "server-only";
import QRCode from "qrcode";
import { db } from "../db";
import { ConflictError, NotFoundError, isUniqueViolation } from "../errors";
import { generatePublicToken } from "../tokens";
import { audit } from "./audit";

/** UC-16: khóa mã đang active. */
export async function lockTag(qrId: string, reason: string, adminId: string) {
  await db.$transaction(async (tx) => {
    const tag = await tx.qrTag.findUnique({ where: { id: qrId } });
    if (!tag) throw new NotFoundError("Mã không tồn tại");
    if (tag.status !== "active") throw new ConflictError("Chỉ khóa được mã đang hoạt động");
    await tx.qrTag.update({
      where: { id: qrId },
      data: { status: "locked", lockReason: reason, lockedAt: new Date() },
    });
    await audit(tx, adminId, "lock", "qr_tag", qrId, reason);
  });
}

/** UC-16 A1: mở khóa; mã replaced không mở được (FR-24). */
export async function unlockTag(qrId: string, adminId: string) {
  await db.$transaction(async (tx) => {
    const tag = await tx.qrTag.findUnique({ where: { id: qrId } });
    if (!tag) throw new NotFoundError("Mã không tồn tại");
    if (tag.status !== "locked") throw new ConflictError("Chỉ mở khóa được mã đang bị khóa");
    await tx.qrTag.update({ where: { id: qrId }, data: { status: "active", lockReason: null, lockedAt: null } });
    await audit(tx, adminId, "unlock", "qr_tag", qrId);
  });
}

/** UC-17: mã cũ thành replaced, sinh mã mới và nối mã cũ sang mã mới. */
export async function reissueTag(petId: string, adminId: string): Promise<{ token: string }> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const pet = await tx.pet.findUnique({ where: { id: petId } });
        if (!pet) throw new NotFoundError("Hồ sơ không tồn tại");
        if (pet.status === "archived") throw new ConflictError("Hãy khôi phục hồ sơ trước khi phát hành lại mã");

        const current = await tx.qrTag.findFirst({ where: { petId, status: { not: "replaced" } } });
        const now = new Date();
        if (current) {
          await tx.qrTag.update({ where: { id: current.id }, data: { status: "replaced", replacedAt: now } });
        }
        const token = generatePublicToken();
        const created = await tx.qrTag.create({ data: { petId, token } });
        if (current) {
          await tx.qrTag.update({ where: { id: current.id }, data: { replacedById: created.id } });
        }
        await audit(tx, adminId, "reissue", "qr_tag", created.id, current ? `thay mã ${current.token.slice(0, 6)}…` : undefined);
        return { token };
      });
    } catch (e) {
      if (attempt < 3 && isUniqueViolation(e, "token")) continue;
      throw e;
    }
  }
}

// FR-22: mức sửa lỗi Q (cao hơn mức tối thiểu M) để chịu được vết xước trên mặt vòng.
const QR_OPTIONS = { errorCorrectionLevel: "Q" as const, margin: 2, color: { dark: "#000000", light: "#ffffff" } };

/** FR-23: PNG 1024 x 1024 px. */
export function renderQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...QR_OPTIONS, type: "png", width: 1024 });
}

export function renderQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
}

export function renderQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { ...QR_OPTIONS, width: 320 });
}
