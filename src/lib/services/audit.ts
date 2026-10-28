import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { AuditAction } from "@/generated/prisma/enums";

type Tx = Prisma.TransactionClient;

/** Ghi nhật ký thao tác admin (FR-35), chạy trong cùng giao dịch với thao tác. */
export function audit(
  tx: Tx,
  adminId: string,
  action: AuditAction,
  targetType: "pet" | "qr_tag" | "order" | "admin_user" | "site_settings",
  targetId: string,
  detail?: string,
) {
  return tx.auditLog.create({ data: { adminId, action, targetType, targetId, detail } });
}
