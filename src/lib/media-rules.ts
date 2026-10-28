// Giới hạn tệp dùng chung cho trình duyệt và máy chủ (SRS v2, FR-18, FR-20, mục 10.2).

export const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // ảnh gốc admin chọn
export const PHOTO_MAX_COUNT = 30;
export const PHOTO_BATCH = 10; // UC-12: tối đa 10 ảnh một lần
export const PHOTO_MAX_DIM = 2000; // cạnh dài của ảnh lưu trữ sau khi nén
export const THUMB_MAX_DIM = 640; // ảnh nhỏ cho lưới ảnh, thường dưới 100 KB
export const THUMB_MAX_BYTES = 1024 * 1024;

export const VIDEO_MIME = ["video/mp4", "video/webm"] as const;
export const VIDEO_MAX_SECONDS = 180;
export const VIDEO_MAX_COUNT = 5;
export const POSTER_MAX_BYTES = 1024 * 1024;

export type PhotoMime = (typeof PHOTO_MIME)[number];
export type VideoMime = (typeof VIDEO_MIME)[number];

export const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function mimeFromKey(key: string): string | null {
  const ext = key.split(".").pop()?.toLowerCase();
  const found = Object.entries(EXT).find(([, e]) => e === ext);
  return found ? found[0] : null;
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1).replace(".0", "")} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
