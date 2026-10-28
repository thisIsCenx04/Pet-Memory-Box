"use client";

import { useState } from "react";
import { Field } from "@/components/form";
import type { FieldErrors } from "@/lib/validation";

// Các ô nhập dùng chung cho form tạo mới (A-03) và form sửa (A-05).

export type PetFieldDefaults = Partial<Record<string, string>>;

export function PetInfoFields({
  defaults,
  errors,
  onLifeStatusChange,
  showLifeStatus = true,
}: {
  defaults: PetFieldDefaults;
  errors?: FieldErrors;
  onLifeStatusChange?: (v: "alive" | "memorial") => void;
  showLifeStatus?: boolean;
}) {
  const [life, setLife] = useState<"alive" | "memorial">(defaults.lifeStatus === "memorial" ? "memorial" : "alive");
  const e = errors ?? {};
  const d = defaults;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showLifeStatus ? (
        <fieldset className="sm:col-span-2">
          <legend className="label">Bé hiện tại</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["alive", "Bé đang sống"],
                ["memorial", "Bé đã mất (trang tưởng niệm)"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm ${
                  life === value ? "border-sage bg-sage-soft" : "border-sand-deep bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="lifeStatus"
                  value={value}
                  checked={life === value}
                  onChange={() => {
                    setLife(value);
                    onLifeStatusChange?.(value);
                  }}
                  className="accent-sage"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="lifeStatus" value={life} />
      )}
      <Field label="Tên bé *" htmlFor="name" error={e.name}>
        <input id="name" name="name" className="input" maxLength={50} defaultValue={d.name} required />
      </Field>
      <Field label="Loài *" htmlFor="species" error={e.species}>
        <select id="species" name="species" className="input" defaultValue={d.species ?? "dog"}>
          <option value="dog">Chó</option>
          <option value="cat">Mèo</option>
          <option value="other">Khác</option>
        </select>
      </Field>
      <Field label="Giống" htmlFor="breed" error={e.breed}>
        <input id="breed" name="breed" className="input" maxLength={50} defaultValue={d.breed} />
      </Field>
      <Field label="Giới tính" htmlFor="gender" error={e.gender}>
        <select id="gender" name="gender" className="input" defaultValue={d.gender ?? "unknown"}>
          <option value="male">Đực</option>
          <option value="female">Cái</option>
          <option value="unknown">Chưa rõ</option>
        </select>
      </Field>
      <Field label="Ngày sinh" htmlFor="birthDate" error={e.birthDate}>
        <input id="birthDate" name="birthDate" type="date" className="input" defaultValue={d.birthDate} />
      </Field>
      {life === "memorial" ? (
        <Field label="Ngày mất" htmlFor="passedDate" error={e.passedDate}>
          <input id="passedDate" name="passedDate" type="date" className="input" defaultValue={d.passedDate} />
        </Field>
      ) : (
        <Field label="Màu lông" htmlFor="coatColor" error={e.coatColor}>
          <input id="coatColor" name="coatColor" className="input" maxLength={50} defaultValue={d.coatColor} />
        </Field>
      )}
      {life === "memorial" ? (
        <Field label="Màu lông" htmlFor="coatColor" error={e.coatColor}>
          <input id="coatColor" name="coatColor" className="input" maxLength={50} defaultValue={d.coatColor} />
        </Field>
      ) : null}
      <Field label="Đặc điểm nhận dạng" htmlFor="traits" error={e.traits} className="sm:col-span-2">
        <input id="traits" name="traits" className="input" maxLength={200} defaultValue={d.traits} />
      </Field>
      <Field
        label="Lưu ý (tính cách, sức khỏe)"
        htmlFor="note"
        error={e.note}
        className="sm:col-span-2"
        hint="Ví dụ: sợ người lạ, đang uống thuốc tim. Tối đa 1.000 ký tự."
      >
        <textarea id="note" name="note" rows={3} className="input" maxLength={1000} defaultValue={d.note} />
      </Field>
      <Field
        label={life === "memorial" ? "Câu tưởng niệm dưới tên bé" : "Câu ngắn dưới tên bé"}
        htmlFor="tagline"
        error={e.tagline}
        className="sm:col-span-2"
        hint="Tối đa 80 ký tự, ví dụ: Always in my heart."
      >
        <input id="tagline" name="tagline" className="input" maxLength={80} defaultValue={d.tagline} />
      </Field>
    </div>
  );
}

export function OwnerFields({ defaults, errors }: { defaults: PetFieldDefaults; errors?: FieldErrors }) {
  const e = errors ?? {};
  const d = defaults;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Họ tên *" htmlFor="ownerName" error={e.ownerName}>
        <input id="ownerName" name="ownerName" className="input" maxLength={80} defaultValue={d.ownerName} required />
      </Field>
      <Field label="Số điện thoại *" htmlFor="phone" error={e.phone} hint="10 số, bắt đầu bằng 0 hoặc +84.">
        <input id="phone" name="phone" type="tel" inputMode="tel" className="input" defaultValue={d.phone} required />
      </Field>
      <Field label="Số điện thoại phụ (nếu có)" htmlFor="phone2" error={e.phone2}>
        <input id="phone2" name="phone2" type="tel" inputMode="tel" className="input" defaultValue={d.phone2} />
      </Field>
      <Field label="Zalo / Messenger" htmlFor="zaloMessenger" error={e.zaloMessenger} hint="Số Zalo hoặc đường dẫn https.">
        <input id="zaloMessenger" name="zaloMessenger" className="input" defaultValue={d.zaloMessenger} />
      </Field>
      <Field label="Khu vực" htmlFor="area" error={e.area} hint="Phường, quận, tỉnh/thành.">
        <input id="area" name="area" className="input" maxLength={100} defaultValue={d.area} />
      </Field>
      <Field label="Địa chỉ đầy đủ" htmlFor="address" error={e.address}>
        <input id="address" name="address" className="input" maxLength={200} defaultValue={d.address} />
      </Field>
    </div>
  );
}

export const VISIBILITY_OPTIONS = [
  { name: "showCallButton", label: "Nút gọi và nhắn tin cho chủ nuôi (khi bé đi lạc)" },
  { name: "showPhone", label: "Số điện thoại chính" },
  { name: "showPhone2", label: "Số điện thoại phụ" },
  { name: "showArea", label: "Khu vực (phường, quận)" },
  { name: "showAddress", label: "Địa chỉ đầy đủ" },
  { name: "showNote", label: "Lưu ý về tính cách và sức khỏe" },
  { name: "showMedia", label: "Ảnh và video" },
  { name: "showMemories", label: "Câu chuyện, kỷ niệm" },
] as const;

export type VisibilityName = (typeof VISIBILITY_OPTIONS)[number]["name"];

export function VisibilityToggles({
  checked,
  onChange,
}: {
  checked: Record<VisibilityName, boolean>;
  onChange: (name: VisibilityName, value: boolean) => void;
}) {
  return (
    <ul className="divide-y divide-sand rounded-xl border border-sand bg-white">
      {VISIBILITY_OPTIONS.map((o) => (
        <li key={o.name}>
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 px-4 py-2 text-sm">
            <span>{o.label}</span>
            <input
              type="checkbox"
              name={o.name}
              checked={checked[o.name]}
              onChange={(ev) => onChange(o.name, ev.target.checked)}
              className="h-5 w-5 shrink-0 accent-sage"
            />
          </label>
        </li>
      ))}
    </ul>
  );
}

/** UC-10 E1: cảnh báo khi người quét không còn cách nào liên lạc. */
export function noContactLeft(v: Record<VisibilityName, boolean>) {
  return !v.showCallButton && !v.showPhone && !v.showPhone2;
}
