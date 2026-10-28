"use client";

import { useState } from "react";
import type { PublicProfile } from "@/lib/services/public-profile";
import { Lightbox } from "./lightbox";

const SPECIES = { dog: "Chó", cat: "Mèo", other: "Thú cưng" } as const;
const GENDER = { male: "Đực", female: "Cái", unknown: "Chưa rõ" } as const;

function vnDate(iso: string | null | undefined) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type TabKey = "photos" | "videos" | "memories" | "profile";

const TAB_LABEL: Record<TabKey, string> = { photos: "Ảnh", videos: "Video", memories: "Kỷ niệm", profile: "Hồ sơ" };

/** FR-24, FR-29: bốn tab, chuyển không tải lại trang; chỉ hiện tab có nội dung. */
export function PetTabs({ profile }: { profile: PublicProfile }) {
  const available: Record<TabKey, boolean> = {
    photos: !!profile.photos?.length,
    videos: !!profile.videos?.length,
    memories: !!profile.memories?.length,
    profile: true,
  };
  // FR-36: trang tưởng niệm ưu tiên Ảnh và Kỷ niệm
  const order: TabKey[] =
    profile.lifeStatus === "memorial"
      ? ["photos", "memories", "videos", "profile"]
      : ["photos", "videos", "memories", "profile"];
  const tabs = order.filter((k) => available[k]).map((key) => ({ key, label: TAB_LABEL[key] }));

  const [active, setActive] = useState<TabKey>(tabs[0].key);

  return (
    <div>
      <div role="tablist" aria-label="Nội dung của bé" className="flex border-b border-sand">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setActive(t.key)}
            className={`-mb-px min-h-11 flex-1 border-b-2 text-sm font-semibold transition-colors duration-200 ${
              active === t.key ? "border-sage text-sage-deep" : "border-transparent text-ink-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={active} role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} className="animate-fade pt-4">
        {active === "photos" ? <Photos profile={profile} /> : null}
        {active === "videos" ? <Videos profile={profile} /> : null}
        {active === "memories" ? <Memories profile={profile} /> : null}
        {active === "profile" ? <ProfileFacts profile={profile} /> : null}
      </div>
    </div>
  );
}

function Photos({ profile }: { profile: PublicProfile }) {
  const [open, setOpen] = useState<number | null>(null);
  const photos = profile.photos!;
  return (
    <>
      <ul className="grid grid-cols-2 gap-3">
        {photos.map((p, i) => (
          <li key={i}>
            <figure>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group block w-full overflow-hidden rounded-2xl bg-sand"
                aria-label={`Xem ảnh ${i + 1} cỡ lớn`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbUrl ?? p.url}
                  alt={p.caption ?? `Ảnh ${i + 1} của ${profile.name}`}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
              {p.caption ? <figcaption className="mt-1 text-xs text-ink-soft">{p.caption}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
      {open !== null ? (
        <Lightbox photos={photos} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} name={profile.name} />
      ) : null}
    </>
  );
}

function Videos({ profile }: { profile: PublicProfile }) {
  return (
    <ul className="space-y-4">
      {profile.videos!.map((v, i) => (
        <li key={i}>
          {v.source === "upload" ? (
            // NFR-02: không tải byte video nào trước khi người xem bấm phát
            <video
              controls
              preload="none"
              playsInline
              poster={v.posterUrl ?? undefined}
              src={v.url}
              className="aspect-video w-full rounded-2xl bg-ink"
            />
          ) : (
            <iframe
              src={v.url}
              title={v.title ?? `Video ${i + 1}`}
              loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="aspect-video w-full rounded-2xl bg-ink"
            />
          )}
          {v.title ? <p className="mt-1 text-sm font-semibold">{v.title}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function Memories({ profile }: { profile: PublicProfile }) {
  return (
    <ol className="space-y-4">
      {profile.memories!.map((m, i) => (
        <li key={i} className="rounded-2xl bg-paper p-4">
          <h3 className="text-lg font-semibold">{m.title}</h3>
          {m.date ? <p className="text-xs text-ink-soft">{vnDate(m.date)}</p> : null}
          {/* Văn bản thuần: React tự escape, không chạy HTML (UC-13 E2) */}
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{m.content}</p>
        </li>
      ))}
    </ol>
  );
}

function ProfileFacts({ profile }: { profile: PublicProfile }) {
  const rows: [string, string | null | undefined][] = [
    ["Loài", SPECIES[profile.species]],
    ["Giống", profile.breed],
    ["Giới tính", GENDER[profile.gender]],
    ["Ngày sinh", vnDate(profile.birthDate)],
    ...(profile.lifeStatus === "memorial" ? ([["Ngày mất", vnDate(profile.passedDate)]] as [string, string | null][]) : []),
    ["Màu lông", profile.coatColor],
    ["Đặc điểm nhận dạng", profile.traits],
    ["Lưu ý", profile.note],
    ["Khu vực", profile.contact.area],
    ["Địa chỉ", profile.contact.address],
    ["Số điện thoại phụ", profile.contact.phone2],
  ];
  return (
    <dl className="divide-y divide-sand rounded-2xl bg-paper px-4">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="flex gap-4 py-3 text-sm">
            <dt className="w-32 shrink-0 text-ink-soft">{k}</dt>
            <dd className="whitespace-pre-line">{v}</dd>
          </div>
        ))}
    </dl>
  );
}
