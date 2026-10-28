"use client";

import { useEffect, useRef, useState } from "react";

export type LightboxPhoto = { url: string; caption: string | null; width: number | null; height: number | null };

/** Trình xem ảnh toàn màn hình: phím mũi tên, vuốt trái/phải, Esc để đóng. */
export function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
  name,
}: {
  photos: LightboxPhoto[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  name: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const photo = photos[index];
  const go = (d: number) => onIndexChange((index + d + photos.length) % photos.length);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndexChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onIndexChange]);

  // Tải trước ảnh kế tiếp để vuốt mượt
  useEffect(() => {
    const next = photos[(index + 1) % photos.length];
    if (next) new Image().src = next.url;
  }, [index, photos]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-label={`Ảnh ${index + 1} trên ${photos.length} của ${name}`}
      className="animate-fade m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-cream backdrop:bg-ink/80"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="font-mono">
            {index + 1} / {photos.length}
          </span>
          <button type="button" onClick={() => ref.current?.close()} className="min-h-11 rounded-full px-4 font-semibold hover:bg-cream/10">
            Đóng
          </button>
        </div>
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-2"
          onClick={(e) => {
            if (e.target === e.currentTarget) ref.current?.close();
          }}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          {!loaded[index] ? <span className="absolute text-sm text-cream/60">Đang tải ảnh…</span> : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={photo.url}
            src={photo.url}
            alt={photo.caption ?? `Ảnh ${index + 1} của ${name}`}
            width={photo.width ?? undefined}
            height={photo.height ?? undefined}
            onLoad={() => setLoaded((l) => ({ ...l, [index]: true }))}
            className={`animate-fade max-h-full max-w-full rounded-lg object-contain transition-opacity ${loaded[index] ? "opacity-100" : "opacity-0"}`}
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={photos.length < 2}
            className="min-h-11 rounded-full px-5 font-semibold hover:bg-cream/10 disabled:opacity-30"
          >
            Trước
          </button>
          <p className="min-w-0 flex-1 text-center text-sm text-cream/85">{photo.caption}</p>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={photos.length < 2}
            className="min-h-11 rounded-full px-5 font-semibold hover:bg-cream/10 disabled:opacity-30"
          >
            Sau
          </button>
        </div>
      </div>
    </dialog>
  );
}
