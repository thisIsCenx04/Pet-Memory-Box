import "server-only";
import { lookupPublicProfile, clientIp, hashIp } from "./services/public-profile";

/** Chỉ nhận yêu cầu gửi từ chính trang web (chặn form giả mạo từ trang khác). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export function jsonError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Tra cứu mã cho các API ghi từ trang công khai; mã không dùng được thì trả null. */
export async function resolveForWrite(req: Request, token: string) {
  const lookup = await lookupPublicProfile(token);
  if (lookup.result !== "ok") return null;
  return { lookup, ipHash: hashIp(clientIp(req.headers)) };
}
