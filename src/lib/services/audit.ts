import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { AuditAction } from "@/generated/prisma/enums";

type Tx = Prisma.TransactionClient;

/** Người thực hiện: id admin, hoặc email chủ nuôi khi thao tác từ cổng chủ nuôi. */
export type Actor = string | { adminId: string } | { ownerEmail: string };

export function actorFields(actor: Actor): { adminId: string | null; actorEmail: string | null } {
  if (typeof actor === "string") return { adminId: actor, actorEmail: null };
  if ("adminId" in actor) return { adminId: actor.adminId, actorEmail: null };
  return { adminId: null, actorEmail: actor.ownerEmail };
}

/** Ghi nhật ký thao tác (FR-35), chạy trong cùng giao dịch với thao tác. */
export function audit(
  tx: Tx,
  actor: Actor,
  action: AuditAction,
  targetType: "pet" | "qr_tag" | "order" | "order_request" | "admin_user" | "site_settings" | "guestbook",
  targetId: string,
  detail?: string,
) {
  return tx.auditLog.create({ data: { ...actorFields(actor), action, targetType, targetId, detail } });
}
