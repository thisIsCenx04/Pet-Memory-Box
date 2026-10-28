import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Kho tệp ảnh và video. Bản chạy thật dùng Supabase Storage; khi phát triển trên máy chưa có
// Supabase thì dùng STORAGE_DRIVER=local (lưu vào thư mục .local-storage).
// Trình duyệt luôn tải tệp thẳng lên kho bằng URL có chữ ký, không đi qua hàm serverless (R-05).

export const BUCKET = "pet-media";

export type UploadTarget = {
  key: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
};

export type ObjectInfo = { size: number };

interface Driver {
  signedUpload(key: string, contentType: string): Promise<UploadTarget>;
  info(key: string): Promise<ObjectInfo | null>;
  publicUrl(key: string): string;
  remove(keys: string[]): Promise<void>;
  move(from: string, to: string): Promise<void>;
  /** Khóa các tệp trong thư mục `prefix/` tạo trước thời điểm `before`. */
  listOlderThan(prefix: string, before: Date): Promise<string[]>;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Chưa cấu hình kho lưu trữ tệp: cần SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.");
    this.name = "StorageNotConfiguredError";
  }
}

// ---------- Supabase ----------

function supabaseDriver(url: string, serviceKey: string): Driver {
  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const bucket = client.storage.from(BUCKET);
  const base = url.replace(/\/+$/, "");
  return {
    async signedUpload(key, contentType) {
      const { data, error } = await bucket.createSignedUploadUrl(key);
      if (error || !data) throw new Error(`Không tạo được URL tải lên: ${error?.message}`);
      return {
        key,
        uploadUrl: data.signedUrl,
        method: "PUT",
        // Token trong URL đã đủ để xác thực; giữ ít header nhất để yêu cầu CORS đơn giản.
        headers: { "content-type": contentType },
      };
    },
    async info(key) {
      const { data, error } = await bucket.info(key);
      if (error || !data) return null;
      const d = data as { size?: number; metadata?: { size?: number } };
      const size = d.size ?? d.metadata?.size;
      return typeof size === "number" ? { size } : null;
    },
    publicUrl(key) {
      return `${base}/storage/v1/object/public/${BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
    },
    async remove(keys) {
      if (!keys.length) return;
      const { error } = await bucket.remove(keys);
      if (error) throw new Error(`Không xóa được tệp: ${error.message}`);
    },
    async move(from, to) {
      const { error } = await bucket.move(from, to);
      if (error) throw new Error(`Không chuyển được tệp: ${error.message}`);
    },
    async listOlderThan(prefix, before) {
      const { data, error } = await bucket.list(prefix, { limit: 1000 });
      if (error || !data) return [];
      return data
        .filter((o) => o.created_at && new Date(o.created_at) < before && o.id)
        .map((o) => `${prefix}/${o.name}`);
    },
  };
}

// ---------- Ổ đĩa cục bộ (chỉ để phát triển và kiểm thử) ----------

export const LOCAL_ROOT = path.join(process.cwd(), ".local-storage");
const LOCAL_TTL_MS = 15 * 60 * 1000;

function localSecret() {
  return process.env.IP_HASH_SALT || "local-dev-secret";
}

export function signLocal(key: string, exp: number): string {
  return createHmac("sha256", localSecret()).update(`${key}:${exp}`).digest("base64url");
}

export function verifyLocal(key: string, exp: number, sig: string): boolean {
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const a = Buffer.from(signLocal(key, exp));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function localPath(key: string): string | null {
  if (!/^[a-z0-9][a-z0-9/_.-]*$/i.test(key) || key.includes("..")) return null;
  return path.join(LOCAL_ROOT, key);
}

function localDriver(): Driver {
  return {
    async signedUpload(key, contentType) {
      const exp = Date.now() + LOCAL_TTL_MS;
      const qs = new URLSearchParams({ exp: String(exp), sig: signLocal(key, exp) });
      return { key, uploadUrl: `/api/dev-storage/${key}?${qs}`, method: "PUT", headers: { "content-type": contentType } };
    },
    async info(key) {
      const p = localPath(key);
      if (!p) return null;
      try {
        const s = await stat(p);
        return { size: s.size };
      } catch {
        return null;
      }
    },
    publicUrl(key) {
      return `/api/dev-storage/${key}`;
    },
    async remove(keys) {
      for (const key of keys) {
        const p = localPath(key);
        if (p) await rm(p, { force: true });
      }
    },
    async move(from, to) {
      const a = localPath(from);
      const b = localPath(to);
      if (!a || !b) throw new Error("Khóa tệp không hợp lệ");
      await mkdir(path.dirname(b), { recursive: true });
      await rename(a, b);
    },
    async listOlderThan(prefix, before) {
      const dir = localPath(prefix);
      if (!dir) return [];
      try {
        const names = await readdir(dir);
        const out: string[] = [];
        for (const name of names) {
          const s = await stat(path.join(dir, name));
          if (s.isFile() && s.mtime < before) out.push(`${prefix}/${name}`);
        }
        return out;
      } catch {
        return [];
      }
    },
  };
}

// ---------- Chọn driver ----------

export function storageDriverName(): "supabase" | "local" | "none" {
  const forced = process.env.STORAGE_DRIVER;
  if (forced === "local" || forced === "supabase") return forced;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return "supabase";
  return process.env.NODE_ENV === "production" ? "none" : "local";
}

let cached: Driver | null = null;

export function storage(): Driver {
  if (cached) return cached;
  const name = storageDriverName();
  if (name === "supabase") {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new StorageNotConfiguredError();
    cached = supabaseDriver(url, key);
  } else if (name === "local") {
    cached = localDriver();
  } else {
    throw new StorageNotConfiguredError();
  }
  return cached;
}
