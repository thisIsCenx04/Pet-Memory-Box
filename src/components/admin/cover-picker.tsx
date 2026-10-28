"use client";

import { useEffect, useState } from "react";
import { requestCoverUploadAction } from "@/app/admin/media-actions";
import { processImage, uploadWithProgress } from "@/lib/client/media";
import { PHOTO_MAX_BYTES, PHOTO_MAX_DIM, PHOTO_MIME, THUMB_MAX_DIM, formatBytes } from "@/lib/media-rules";

type Uploaded = { key: string; thumbKey: string; width: number; height: number; preview: string };

/**
 * Ảnh đại diện trong form tạo hồ sơ (UC-06 bước 4): tải lên vùng tạm trước khi hồ sơ tồn tại,
 * khóa tệp gửi kèm form để máy chủ chuyển vào thư mục của hồ sơ.
 */
export function CoverPicker({ onBusyChange }: { onBusyChange?: (busy: boolean) => void }) {
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (uploaded) URL.revokeObjectURL(uploaded.preview);
  }, [uploaded]);

  async function pick(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!(PHOTO_MIME as readonly string[]).includes(file.type)) return setError("Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
    if (file.size > PHOTO_MAX_BYTES) return setError(`Ảnh lớn hơn ${formatBytes(PHOTO_MAX_BYTES)}.`);
    onBusyChange?.(true);
    setProgress(0);
    try {
      const full = await processImage(file, PHOTO_MAX_DIM, 0.86);
      const thumb = await processImage(file, THUMB_MAX_DIM, 0.78);
      const res = await requestCoverUploadAction({
        mimeType: full.mimeType,
        sizeBytes: full.blob.size,
        thumbMimeType: thumb.mimeType,
        thumbSizeBytes: thumb.blob.size,
      });
      if (!res.ok) throw new Error(res.message);
      await uploadWithProgress(res.data.thumb, thumb.blob);
      await uploadWithProgress(res.data.photo, full.blob, setProgress);
      setUploaded({
        key: res.data.photo.key,
        thumbKey: res.data.thumb.key,
        width: full.width,
        height: full.height,
        preview: URL.createObjectURL(thumb.blob),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
      onBusyChange?.(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-sand">
        {uploaded ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={uploaded.preview} alt="Ảnh đại diện đã chọn" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-ink-soft">Chưa có ảnh</span>
        )}
        {progress !== null ? (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-sm font-semibold text-white">
            {Math.round(progress * 100)}%
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-sm font-medium">Ảnh đại diện</p>
        <p className="text-xs text-ink-soft">Ảnh rõ mặt, chụp chính diện, dưới {formatBytes(PHOTO_MAX_BYTES)}.</p>
        <div className="mt-2 flex gap-2">
          <input
            id="cover-file"
            type="file"
            accept={PHOTO_MIME.join(",")}
            className="sr-only"
            disabled={progress !== null}
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <label htmlFor="cover-file" className="btn-outline min-h-9 cursor-pointer px-4 text-xs">
            {uploaded ? "Đổi ảnh" : "Chọn ảnh"}
          </label>
          {uploaded ? (
            <button type="button" className="btn-outline min-h-9 px-4 text-xs" onClick={() => setUploaded(null)}>
              Bỏ ảnh
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
      {uploaded ? (
        <>
          <input type="hidden" name="coverKey" value={uploaded.key} />
          <input type="hidden" name="coverThumbKey" value={uploaded.thumbKey} />
          <input type="hidden" name="coverWidth" value={uploaded.width} />
          <input type="hidden" name="coverHeight" value={uploaded.height} />
        </>
      ) : null}
    </div>
  );
}
