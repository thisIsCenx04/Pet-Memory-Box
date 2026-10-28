import { createHash, randomBytes } from "node:crypto";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const PUBLIC_TOKEN_LENGTH = 22; // ~131 bit (NFR-06)

/** Token base62 sinh bằng CSPRNG, lấy mẫu loại bỏ để không lệch phân phối. */
export function generatePublicToken(length = PUBLIC_TOKEN_LENGTH): string {
  let out = "";
  while (out.length < length) {
    for (const byte of randomBytes(length * 2)) {
      if (byte < 248) out += BASE62[byte % 62]; // 248 = 62 * 4
      if (out.length === length) break;
    }
  }
  return out;
}

export function isPublicTokenFormat(value: string): boolean {
  return /^[0-9A-Za-z]{22}$/.test(value);
}

export function formatCardNo(seq: number | bigint): string {
  return `PMB-${String(seq).padStart(6, "0")}`;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
