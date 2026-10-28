"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  confirmPhotoAction,
  deletePhotoAction,
  reorderPhotosAction,
  requestPhotoUploadsAction,
  setCoverPhotoAction,
  updatePhotoCaptionAction,
} from "@/app/admin/media-actions";
import { processImage, uploadWithProgress } from "@/lib/client/media";
import {
  PHOTO_BATCH,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_COUNT,
  PHOTO_MAX_DIM,
  PHOTO_MIME,
  THUMB_MAX_DIM,
  formatBytes,
} from "@/lib/media-rules";

export type PhotoItem = {
  id: string;
  url: string;
  thumbUrl: string | null;
  caption: string | null;
  isCover: boolean;
};

type UploadRow = {
  id: string;
  name: string;
  status: "waiting" | "processing" | "uploading" | "saving" | "done" | "error";
  progress: number;
  message?: string;
};

const STATUS_LABEL: Record<UploadRow["status"], string> = {
  waiting: "Đang chờ",
  processing: "Đang nén ảnh",
  uploading: "Đang tải lên",
  saving: "Đang lưu",
  done: "Xong",
  error: "Lỗi",
};

/** UC-12: tải lên, chọn ảnh đại diện, chú thích, sắp xếp và xóa ảnh. */
export function PhotoManager({ petId, photos }: { petId: string; photos: PhotoItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(photos);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  // Đồng bộ thứ tự khi máy chủ trả danh sách mới (mẫu "điều chỉnh state khi props đổi" của React).
  const [prevPhotos, setPrevPhotos] = useState(photos);
  if (photos !== prevPhotos) {
    setPrevPhotos(photos);
    setOrder(photos);
  }

  const remaining = PHOTO_MAX_COUNT - photos.length;
  const patch = (id: string, p: Partial<UploadRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (!files.length || busy) return;
    setNotice(null);
    const newRows: UploadRow[] = [];
    const accepted: { row: UploadRow; file: File }[] = [];
    for (const file of files) {
      const row: UploadRow = { id: crypto.randomUUID(), name: file.name, status: "waiting", progress: 0 };
      newRows.push(row);
      if (!(PHOTO_MIME as readonly string[]).includes(file.type)) {
        Object.assign(row, { status: "error", message: "Chỉ nhận JPEG, PNG, WebP" });
      } else if (file.size > PHOTO_MAX_BYTES) {
        Object.assign(row, { status: "error", message: `Lớn hơn ${formatBytes(PHOTO_MAX_BYTES)}` });
      } else if (accepted.length >= Math.min(PHOTO_BATCH, remaining)) {
        Object.assign(row, {
          status: "error",
          message: accepted.length >= PHOTO_BATCH ? `Mỗi lần tối đa ${PHOTO_BATCH} ảnh` : `Đã đủ ${PHOTO_MAX_COUNT} ảnh`,
        });
      } else {
        accepted.push({ row, file });
      }
    }
    setRows(newRows);
    if (!accepted.length) return;
    setBusy(true);

    // 1. Nén ảnh và tạo ảnh nhỏ trên trình duyệt
    const prepared: { row: UploadRow; full: Awaited<ReturnType<typeof processImage>>; thumb: Awaited<ReturnType<typeof processImage>> }[] = [];
    for (const { row, file } of accepted) {
      patch(row.id, { status: "processing" });
      try {
        const full = await processImage(file, PHOTO_MAX_DIM, 0.86);
        const thumb = await processImage(file, THUMB_MAX_DIM, 0.78);
        prepared.push({ row, full, thumb });
      } catch (e) {
        patch(row.id, { status: "error", message: (e as Error).message });
      }
    }
    if (!prepared.length) {
      setBusy(false);
      return;
    }

    // 2. Xin URL tải lên cho cả lượt
    const targets = await requestPhotoUploadsAction(
      petId,
      prepared.map((p) => ({
        mimeType: p.full.mimeType,
        sizeBytes: p.full.blob.size,
        thumbMimeType: p.thumb.mimeType,
        thumbSizeBytes: p.thumb.blob.size,
      })),
    );
    if (!targets.ok) {
      for (const p of prepared) patch(p.row.id, { status: "error", message: targets.message });
      setBusy(false);
      return;
    }

    // 3. Tải lên 3 ảnh cùng lúc, ảnh lỗi không chặn ảnh khác (UC-12 E1, E3)
    let ok = 0;
    const queue = prepared.map((p, i) => ({ ...p, target: targets.data[i] }));
    async function worker() {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const { row, full, thumb, target } = item;
        try {
          patch(row.id, { status: "uploading", progress: 0 });
          const total = full.blob.size + thumb.blob.size;
          await uploadWithProgress(target.thumb, thumb.blob);
          await uploadWithProgress(target.photo, full.blob, (p) =>
            patch(row.id, { progress: (thumb.blob.size + p * full.blob.size) / total }),
          );
          patch(row.id, { status: "saving", progress: 1 });
          const res = await confirmPhotoAction(petId, {
            key: target.photo.key,
            thumbKey: target.thumb.key,
            width: full.width,
            height: full.height,
          });
          if (!res.ok) throw new Error(res.message);
          patch(row.id, { status: "done" });
          ok++;
        } catch (e) {
          patch(row.id, { status: "error", message: (e as Error).message });
        }
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    setBusy(false);
    setNotice({ ok: ok > 0, text: ok > 0 ? `Đã thêm ${ok} ảnh.` : "Chưa tải được ảnh nào." });
    router.refresh();
  }

  function runAction(fn: () => Promise<{ ok: boolean; message?: string }>, success?: string) {
    start(async () => {
      const res = await fn();
      setNotice(res.ok ? (success ? { ok: true, text: success } : null) : { ok: false, text: res.message ?? "Có lỗi xảy ra" });
      router.refresh();
    });
  }

  function move(id: string, dir: -1 | 1) {
    const i = order.findIndex((p) => p.id === id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    runAction(() => reorderPhotosAction(petId, next.map((p) => p.id)));
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const next = order.filter((p) => p.id !== dragId);
    next.splice(next.findIndex((p) => p.id === targetId), 0, order.find((p) => p.id === dragId)!);
    setOrder(next);
    setDragId(null);
    runAction(() => reorderPhotosAction(petId, next.map((p) => p.id)));
  }

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDropActive(true);
          }
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setDropActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dropActive ? "border-sage bg-sage-soft" : "border-sand-deep bg-white"
        }`}
      >
        <p className="font-semibold">Kéo ảnh vào đây hoặc chọn từ máy</p>
        <p className="mt-1 text-xs text-ink-soft">
          JPEG, PNG, WebP, mỗi ảnh tối đa {formatBytes(PHOTO_MAX_BYTES)}, mỗi lần {PHOTO_BATCH} ảnh. Đã có {photos.length}/
          {PHOTO_MAX_COUNT} ảnh. Ảnh được nén và xóa thông tin vị trí trước khi tải lên.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_MIME.join(",")}
          multiple
          className="sr-only"
          id={`photo-input-${petId}`}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={busy || remaining <= 0}
        />
        <label
          htmlFor={`photo-input-${petId}`}
          className={`btn-primary mt-4 cursor-pointer ${busy || remaining <= 0 ? "pointer-events-none opacity-60" : ""}`}
        >
          {busy ? "Đang tải lên…" : remaining <= 0 ? "Đã đủ ảnh" : "Chọn ảnh"}
        </label>
      </div>

      {rows.length ? (
        <ul className="space-y-2" aria-live="polite">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-sand bg-white px-4 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate">{r.name}</span>
                <span className={r.status === "error" ? "text-danger" : r.status === "done" ? "text-sage-deep" : "text-ink-soft"}>
                  {r.status === "error" ? r.message : STATUS_LABEL[r.status]}
                </span>
              </div>
              {r.status === "uploading" || r.status === "saving" ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
                  <div className="h-full bg-sage transition-[width]" style={{ width: `${Math.round(r.progress * 100)}%` }} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {notice ? (
        <p role={notice.ok ? "status" : "alert"} className={`text-sm ${notice.ok ? "text-sage-deep" : "text-danger"}`}>
          {notice.text}
        </p>
      ) : null}

      {order.length ? (
        <ul className={`grid grid-cols-2 gap-4 sm:grid-cols-3 ${pending ? "opacity-80" : ""}`}>
          {order.map((p, i) => (
            <li
              key={p.id}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => {
                if (dragId) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                dropOn(p.id);
              }}
              className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${
                dragId === p.id ? "opacity-50" : ""
              } ${p.isCover ? "border-sage ring-2 ring-sage/30" : "border-sand"}`}
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbUrl ?? p.url}
                  alt={p.caption ?? `Ảnh ${i + 1}`}
                  className="aspect-square w-full cursor-grab bg-sand object-cover"
                  loading="lazy"
                />
                {p.isCover ? (
                  <span className="absolute top-2 left-2 rounded-full bg-sage px-2.5 py-0.5 text-xs font-semibold text-white">
                    Ảnh đại diện
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-3">
                <label className="sr-only" htmlFor={`cap-${p.id}`}>
                  Chú thích ảnh {i + 1}
                </label>
                <input
                  id={`cap-${p.id}`}
                  defaultValue={p.caption ?? ""}
                  placeholder="Thêm chú thích"
                  maxLength={200}
                  className="input min-h-9 py-1 text-xs"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (p.caption ?? "")) runAction(() => updatePhotoCaptionAction(petId, p.id, v), "Đã lưu chú thích.");
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {!p.isCover ? (
                    <button
                      type="button"
                      className="btn-outline min-h-8 px-3 text-xs"
                      onClick={() => runAction(() => setCoverPhotoAction(petId, p.id), "Đã đổi ảnh đại diện.")}
                    >
                      Làm ảnh đại diện
                    </button>
                  ) : null}
                  <button type="button" className="btn-outline min-h-8 px-3 text-xs" disabled={i === 0} onClick={() => move(p.id, -1)}>
                    Trước
                  </button>
                  <button
                    type="button"
                    className="btn-outline min-h-8 px-3 text-xs"
                    disabled={i === order.length - 1}
                    onClick={() => move(p.id, 1)}
                  >
                    Sau
                  </button>
                  <button
                    type="button"
                    className="btn-danger min-h-8 px-3 text-xs"
                    onClick={() => {
                      if (window.confirm("Xóa ảnh này? Không khôi phục được.")) {
                        runAction(() => deletePhotoAction(petId, p.id), "Đã xóa ảnh.");
                      }
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-soft">Chưa có ảnh nào. Ảnh đầu tiên tải lên sẽ tự làm ảnh đại diện.</p>
      )}
    </div>
  );
}
