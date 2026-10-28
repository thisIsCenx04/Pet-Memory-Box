"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  confirmVideoAction,
  deleteVideoAction,
  moveVideoAction,
  requestVideoUploadAction,
  updateVideoTitleAction,
} from "@/app/admin/media-actions";
import { formatDuration, probeVideo, uploadWithProgress } from "@/lib/client/media";
import { VIDEO_MAX_COUNT, VIDEO_MAX_SECONDS, VIDEO_MIME, formatBytes } from "@/lib/media-rules";

export type VideoItem = {
  id: string;
  source: "upload" | "youtube" | "vimeo";
  title: string | null;
  url: string;
  posterUrl: string | null;
  durationSec: number | null;
  sizeBytes: number | null;
};

type Stage = { step: "idle" } | { step: "checking" } | { step: "uploading"; progress: number } | { step: "saving" };

const SOURCE_LABEL = { upload: "Tải lên", youtube: "YouTube", vimeo: "Vimeo" } as const;

/** UC-13: tải video lên trực tiếp kèm ảnh bìa, sửa tiêu đề, sắp xếp, xóa. */
export function VideoManager({ petId, videos, maxBytes }: { petId: string; videos: VideoItem[]; maxBytes: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<Stage>({ step: "idle" });
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const uploads = videos.filter((v) => v.source === "upload").length;
  const full = uploads >= VIDEO_MAX_COUNT;
  const working = stage.step !== "idle";

  function pick(f: File | undefined) {
    setNotice(null);
    if (!f) return;
    if (!(VIDEO_MIME as readonly string[]).includes(f.type)) {
      setNotice({ ok: false, text: "Chỉ nhận video MP4 hoặc WebM." });
      return;
    }
    if (f.size > maxBytes) {
      setNotice({ ok: false, text: `Video ${formatBytes(f.size)} vượt quá giới hạn ${formatBytes(maxBytes)}.` });
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").slice(0, 100));
  }

  async function upload() {
    if (!file) return;
    setNotice(null);
    try {
      setStage({ step: "checking" });
      const probe = await probeVideo(file);
      if (probe.durationSec > VIDEO_MAX_SECONDS + 0.5) {
        throw new Error(`Video dài ${formatDuration(probe.durationSec)}, tối đa ${VIDEO_MAX_SECONDS / 60} phút.`);
      }
      const targets = await requestVideoUploadAction(petId, {
        mimeType: file.type,
        sizeBytes: file.size,
        durationSec: probe.durationSec,
        posterMimeType: probe.poster.mimeType,
        posterSizeBytes: probe.poster.blob.size,
      });
      if (!targets.ok) throw new Error(targets.message);
      setStage({ step: "uploading", progress: 0 });
      await uploadWithProgress(targets.data.poster, probe.poster.blob);
      await uploadWithProgress(targets.data.video, file, (p) => setStage({ step: "uploading", progress: p }));
      setStage({ step: "saving" });
      const res = await confirmVideoAction(petId, {
        key: targets.data.video.key,
        posterKey: targets.data.poster.key,
        durationSec: probe.durationSec,
        title,
      });
      if (!res.ok) throw new Error(res.message);
      setNotice({ ok: true, text: "Đã tải video lên." });
      setFile(null);
      setTitle("");
      router.refresh();
    } catch (e) {
      setNotice({ ok: false, text: (e as Error).message });
    } finally {
      setStage({ step: "idle" });
    }
  }

  function runAction(fn: () => Promise<{ ok: boolean; message?: string }>, success?: string) {
    start(async () => {
      const res = await fn();
      setNotice(res.ok ? (success ? { ok: true, text: success } : null) : { ok: false, text: res.message ?? "Có lỗi xảy ra" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sand bg-white p-5">
        <p className="font-semibold">Tải video lên</p>
        <p className="mt-1 text-xs text-ink-soft">
          MP4 hoặc WebM, tối đa {formatBytes(maxBytes)} và {VIDEO_MAX_SECONDS / 60} phút. Đã dùng {uploads}/{VIDEO_MAX_COUNT}{" "}
          video tải lên. Video chỉ được tải khi người xem bấm phát.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="min-w-0">
            <span className="label">Tệp video</span>
            <input
              id="video-file"
              type="file"
              accept={VIDEO_MIME.join(",")}
              disabled={working || full}
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="sr-only"
            />
            <div className="flex min-h-11 items-center gap-3">
              <label
                htmlFor="video-file"
                className={`btn-outline shrink-0 cursor-pointer ${working || full ? "pointer-events-none opacity-60" : ""}`}
              >
                {file ? "Đổi tệp" : "Chọn video"}
              </label>
              <span className="truncate text-sm text-ink-soft">
                {file ? `${file.name} · ${formatBytes(file.size)}` : "Chưa chọn tệp"}
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="video-upload-title" className="label">
              Tiêu đề
            </label>
            <input
              id="video-upload-title"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              disabled={working}
            />
          </div>
          <button type="button" className="btn-primary" disabled={!file || working || full} onClick={upload}>
            {stage.step === "checking"
              ? "Đang kiểm tra…"
              : stage.step === "uploading"
                ? `Đang tải ${Math.round(stage.progress * 100)}%`
                : stage.step === "saving"
                  ? "Đang lưu…"
                  : "Tải lên"}
          </button>
        </div>
        {stage.step === "uploading" ? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={Math.round(stage.progress * 100)}>
            <div className="h-full bg-sage transition-[width]" style={{ width: `${Math.round(stage.progress * 100)}%` }} />
          </div>
        ) : null}
        {full ? <p className="mt-3 text-xs text-ink-soft">Đã đủ {VIDEO_MAX_COUNT} video tải lên. Xóa bớt để thêm video mới.</p> : null}
      </div>

      {notice ? (
        <p role={notice.ok ? "status" : "alert"} className={`text-sm ${notice.ok ? "text-sage-deep" : "text-danger"}`}>
          {notice.text}
        </p>
      ) : null}

      {videos.length ? (
        <ul className={`space-y-3 ${pending ? "opacity-80" : ""}`}>
          {videos.map((v, i) => (
            <li key={v.id} className="flex flex-col gap-3 rounded-2xl border border-sand bg-white p-3 sm:flex-row sm:items-center">
              <div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-ink sm:w-40">
                {v.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-cream/80">
                    {SOURCE_LABEL[v.source]}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <label className="sr-only" htmlFor={`vt-${v.id}`}>
                  Tiêu đề video {i + 1}
                </label>
                <input
                  id={`vt-${v.id}`}
                  defaultValue={v.title ?? ""}
                  placeholder="Thêm tiêu đề"
                  maxLength={100}
                  className="input min-h-9 py-1"
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (v.title ?? "")) runAction(() => updateVideoTitleAction(petId, v.id, val), "Đã lưu tiêu đề.");
                  }}
                />
                <p className="text-xs text-ink-soft">
                  {SOURCE_LABEL[v.source]}
                  {v.durationSec ? ` · ${formatDuration(v.durationSec)}` : ""}
                  {v.sizeBytes ? ` · ${formatBytes(v.sizeBytes)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className="btn-outline min-h-9 px-3 text-xs"
                  disabled={i === 0}
                  onClick={() => runAction(() => moveVideoAction(petId, v.id, -1))}
                >
                  Lên
                </button>
                <button
                  type="button"
                  className="btn-outline min-h-9 px-3 text-xs"
                  disabled={i === videos.length - 1}
                  onClick={() => runAction(() => moveVideoAction(petId, v.id, 1))}
                >
                  Xuống
                </button>
                <button
                  type="button"
                  className="btn-danger min-h-9 px-3 text-xs"
                  onClick={() => {
                    if (window.confirm("Xóa video này? Không khôi phục được.")) {
                      runAction(() => deleteVideoAction(petId, v.id), "Đã xóa video.");
                    }
                  }}
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
