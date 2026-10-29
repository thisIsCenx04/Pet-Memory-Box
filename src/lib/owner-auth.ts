import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentAdmin } from "./auth";
import { db } from "./db";
import { sendMail } from "./mail";
import { siteUrl } from "./site";
import { generateSessionToken, sha256 } from "./tokens";
import type { Actor } from "./services/audit";

// Đăng nhập của chủ nuôi bằng mã OTP gửi qua email. Không có mật khẩu.
// Chủ nuôi thấy các hồ sơ có owners.email trùng email đăng nhập (admin nhập email khi tạo hồ sơ).

import { OWNER_COOKIE } from "./session-cookie";

export { OWNER_COOKIE };
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_MS = 60 * 1000;
const OTP_PER_HOUR = 5;
const OTP_PER_IP_HOUR = 15;

function otpHash(email: string, code: string) {
  return createHmac("sha256", process.env.IP_HASH_SALT || "otp-secret").update(`${email}:${code}`).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type RequestOtpResult = { ok: true } | { ok: false; message: string; retryAfterSec?: number };

/**
 * Gửi mã đăng nhập. Luôn trả lời giống nhau dù email có trong hệ thống hay không,
 * để không ai dò được email của chủ nuôi.
 */
export async function requestOwnerOtp(emailInput: string, ipHash: string): Promise<RequestOtpResult> {
  const email = normalizeEmail(emailInput);
  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);

  const [recent, perHour, perIp] = await Promise.all([
    db.ownerOtp.findFirst({ where: { email }, orderBy: { createdAt: "desc" } }),
    db.ownerOtp.count({ where: { email, createdAt: { gte: hourAgo } } }),
    db.ownerOtp.count({ where: { ipHash, createdAt: { gte: hourAgo } } }),
  ]);
  if (recent && now - recent.createdAt.getTime() < OTP_RESEND_MS) {
    const wait = Math.ceil((OTP_RESEND_MS - (now - recent.createdAt.getTime())) / 1000);
    return { ok: false, message: `Vui lòng đợi ${wait} giây rồi gửi lại mã.`, retryAfterSec: wait };
  }
  if (perHour >= OTP_PER_HOUR || perIp >= OTP_PER_IP_HOUR) {
    return { ok: false, message: "Bạn đã yêu cầu quá nhiều mã. Thử lại sau một giờ." };
  }

  const owner = await db.owner.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, pets: { some: {} } },
    select: { id: true },
  });
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  // Vẫn ghi một bản ghi khi email không tồn tại để giới hạn tần suất áp dụng như nhau.
  await db.ownerOtp.create({
    data: { email, codeHash: owner ? otpHash(email, code) : "-", expiresAt: new Date(now + OTP_TTL_MS), ipHash },
  });
  if (owner) {
    await sendMail({
      to: email,
      subject: `Mã đăng nhập Furever: ${code}`,
      text: `Mã đăng nhập của bạn là: ${code}\n\nMã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.\n\n${siteUrl()}/chu-nuoi/dang-nhap`,
    });
  }
  return { ok: true };
}

export type VerifyOtpResult = { ok: true } | { ok: false; message: string };

export async function verifyOwnerOtp(emailInput: string, codeInput: string): Promise<VerifyOtpResult> {
  const email = normalizeEmail(emailInput);
  const code = codeInput.replace(/\s/g, "");
  const fail = { ok: false as const, message: "Mã không đúng hoặc đã hết hạn." };
  if (!/^\d{6}$/.test(code)) return fail;

  const otp = await db.ownerOtp.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.codeHash === "-") return fail;
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, message: "Nhập sai quá nhiều lần. Hãy yêu cầu mã mới." };
  }
  const a = Buffer.from(otp.codeHash);
  const b = Buffer.from(otpHash(email, code));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await db.ownerOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return fail;
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await db.$transaction([
    db.ownerOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    db.ownerSession.create({ data: { email, tokenHash: sha256(token), expiresAt, userAgent } }),
  ]);
  (await cookies()).set(OWNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return { ok: true };
}

export type OwnerIdentity = { email: string; sessionId: string };

export const getCurrentOwner = cache(async (): Promise<OwnerIdentity | null> => {
  const token = (await cookies()).get(OWNER_COOKIE)?.value;
  if (!token) return null;
  const session = await db.ownerSession.findUnique({ where: { tokenHash: sha256(token) } });
  if (!session || session.expiresAt <= new Date()) return null;
  return { email: session.email, sessionId: session.id };
});

export async function requireOwner(): Promise<OwnerIdentity> {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/chu-nuoi/dang-nhap");
  return owner;
}

export async function logoutOwner() {
  const store = await cookies();
  const token = store.get(OWNER_COOKIE)?.value;
  if (token) await db.ownerSession.deleteMany({ where: { tokenHash: sha256(token) } });
  store.delete(OWNER_COOKIE);
}

/** Hồ sơ mà chủ nuôi đang đăng nhập được quản lý; trả 404 nếu không phải của họ. */
export async function requireOwnerPet(petId: string) {
  const owner = await requireOwner();
  if (!/^[0-9a-f-]{36}$/i.test(petId)) notFound();
  const pet = await db.pet.findFirst({
    where: { id: petId, owner: { email: { equals: owner.email, mode: "insensitive" } } },
    select: { id: true, status: true },
  });
  if (!pet) notFound();
  return { owner, pet };
}

export class ForbiddenError extends Error {
  constructor() {
    super("Bạn không có quyền với hồ sơ này");
    this.name = "ForbiddenError";
  }
}

/**
 * Ai được sửa nội dung của một hồ sơ: admin, hoặc chủ nuôi của chính hồ sơ đó khi hồ sơ chưa bị lưu trữ.
 * Trả về người thực hiện để ghi nhật ký.
 */
export async function requirePetEditor(petId: string): Promise<Actor> {
  const admin = await getCurrentAdmin();
  if (admin) return admin.id;
  const owner = await getCurrentOwner();
  if (owner && /^[0-9a-f-]{36}$/i.test(petId)) {
    const pet = await db.pet.findFirst({
      where: { id: petId, status: "active", owner: { email: { equals: owner.email, mode: "insensitive" } } },
      select: { id: true },
    });
    if (pet) return { ownerEmail: owner.email };
  }
  throw new ForbiddenError();
}
