import "server-only";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE } from "./session-cookie";
import { generateSessionToken, sha256 } from "./tokens";

// Xác thực admin tự viết (D-04): phiên lưu ở admin_sessions, cookie chỉ chứa token thô.

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // FR-04
const MAX_FAILED_ATTEMPTS = 5; // FR-05
const LOCKOUT_MS = 15 * 60 * 1000;
export const BCRYPT_COST = 12; // NFR-05: từ 10 trở lên

// Băm giả để so khớp khi email không tồn tại, tránh lộ email qua thời gian phản hồi.
const DUMMY_HASH = "$2b$12$yxWQUpPfkcPdkhyybiJ7lO8A7U0zHrefq9mPu0fpoUHsSdGMjp/sa";

export type AdminIdentity = { id: string; email: string; sessionId: string };

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "locked"; until: Date };

export async function login(emailInput: string, password: string): Promise<LoginResult> {
  const email = emailInput.trim().toLowerCase();
  const admin = await db.adminUser.findUnique({ where: { email } });
  const now = new Date();

  if (!admin) {
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false, reason: "invalid" };
  }
  if (admin.lockedUntil && admin.lockedUntil > now) {
    return { ok: false, reason: "locked", until: admin.lockedUntil };
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    const attempts = admin.failedAttempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    await db.adminUser.update({
      where: { id: admin.id },
      data: lock
        ? { failedAttempts: 0, lockedUntil: new Date(now.getTime() + LOCKOUT_MS) }
        : { failedAttempts: attempts },
    });
    return lock
      ? { ok: false, reason: "locked", until: new Date(now.getTime() + LOCKOUT_MS) }
      : { ok: false, reason: "invalid" };
  }

  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 200) ?? null;

  await db.$transaction([
    db.adminUser.update({ where: { id: admin.id }, data: { failedAttempts: 0, lockedUntil: null } }),
    db.adminSession.create({ data: { adminId: admin.id, tokenHash: sha256(token), expiresAt, userAgent } }),
    db.adminSession.deleteMany({ where: { adminId: admin.id, expiresAt: { lt: now } } }),
  ]);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return { ok: true };
}

/** Admin của request hiện tại, hoặc null. Gọi nhiều lần trong một request chỉ truy vấn một lần. */
export const getCurrentAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { admin: { select: { id: true, email: true } } },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return { id: session.admin.id, email: session.admin.email, sessionId: session.id };
});

/** Dùng trong trang admin: chuyển về trang đăng nhập nếu chưa có phiên. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
  store.delete(SESSION_COOKIE);
}

export type ChangePasswordResult = { ok: true } | { ok: false; field: "currentPassword"; message: string };

/** FR-07: đổi mật khẩu và hủy mọi phiên khác phiên hiện tại. */
export async function changePassword(
  admin: AdminIdentity,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return { ok: false, field: "currentPassword", message: "Mật khẩu hiện tại không đúng" };
  }
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await db.$transaction([
    db.adminUser.update({ where: { id: admin.id }, data: { passwordHash } }),
    db.adminSession.deleteMany({ where: { adminId: admin.id, id: { not: admin.sessionId } } }),
    db.auditLog.create({
      data: { adminId: admin.id, action: "password_change", targetType: "admin_user", targetId: admin.id },
    }),
  ]);
  return { ok: true };
}
