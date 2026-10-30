"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { Field, Notice } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";
import { createOrderAction } from "./actions";

const PACKAGES = [
  { key: "full_box", title: "Pet Memory Box đầy đủ", desc: "Hộp thiếc, đất sét in dấu chân, ảnh, lọ đựng lông, thẻ căn cước và vòng cổ QR." },
  { key: "tag_only", title: "Chỉ vòng cổ QR", desc: "Vòng cổ gắn mã QR và trang Digital Memory riêng cho bé." },
] as const;

const vnd = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

export function OrderForm({ pricing }: { pricing: { full_box: number | null; tag_only: number | null } }) {
  const [state, action] = useActionState<ActionState, FormData>(createOrderAction, {});
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const firstOpen = PACKAGES.find((p) => pricing[p.key])?.key;
  const [pkg, setPkg] = useState<string>(v.package ?? firstOpen ?? "");
  const [life, setLife] = useState(v.lifeStatus ?? "alive");
  const amount = pricing[pkg as keyof typeof pricing];

  return (
    <form action={action} noValidate className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Notice state={state} />
        <section className="card p-5 sm:p-6">
          <h2 className="text-xl font-semibold">1. Chọn gói</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PACKAGES.map((p) => {
              const price = pricing[p.key];
              return (
                <label
                  key={p.key}
                  className={`flex gap-3 rounded-2xl border p-4 transition-colors ${
                    !price ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  } ${pkg === p.key ? "border-sage bg-sage-soft" : "border-sand-deep bg-white"}`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={p.key}
                    checked={pkg === p.key}
                    disabled={!price}
                    onChange={() => setPkg(p.key)}
                    className="mt-1 accent-sage"
                  />
                  <span>
                    <span className="block font-semibold">{p.title}</span>
                    <span className="mt-1 block text-xs text-ink-soft">{p.desc}</span>
                    <span className="mt-2 block font-heading text-xl font-bold">{price ? vnd(price) : "Liên hệ"}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {e.package ? <p className="mt-2 text-xs text-danger">{e.package[0]}</p> : null}
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="text-xl font-semibold sm:col-span-2">2. Thông tin của bé</h2>
          <fieldset className="sm:col-span-2">
            <legend className="label">Bé hiện tại</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["alive", "Bé đang ở bên bạn"],
                  ["memorial", "Bé đã đi xa"],
                ] as const
              ).map(([val, label]) => (
                <label
                  key={val}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm ${
                    life === val ? "border-sage bg-sage-soft" : "border-sand-deep bg-white"
                  }`}
                >
                  <input type="radio" name="lifeStatus" value={val} checked={life === val} onChange={() => setLife(val)} className="accent-sage" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Tên bé *" htmlFor="petName" error={e.petName}>
            <input id="petName" name="petName" maxLength={50} className="input" defaultValue={v.petName} />
          </Field>
          <Field label="Loài *" htmlFor="species" error={e.species}>
            <select id="species" name="species" className="input" defaultValue={v.species ?? "dog"}>
              <option value="dog">Chó</option>
              <option value="cat">Mèo</option>
              <option value="other">Khác</option>
            </select>
          </Field>
          <Field label="Giống" htmlFor="breed" error={e.breed}>
            <input id="breed" name="breed" maxLength={50} className="input" defaultValue={v.breed} />
          </Field>
          <Field label="Giới tính" htmlFor="gender">
            <select id="gender" name="gender" className="input" defaultValue={v.gender ?? "unknown"}>
              <option value="male">Đực</option>
              <option value="female">Cái</option>
              <option value="unknown">Chưa rõ</option>
            </select>
          </Field>
          <Field label="Ngày sinh" htmlFor="birthDate" error={e.birthDate}>
            <input id="birthDate" name="birthDate" type="date" className="input" defaultValue={v.birthDate} />
          </Field>
          {life === "memorial" ? (
            <Field label="Ngày bé đi xa" htmlFor="passedDate" error={e.passedDate}>
              <input id="passedDate" name="passedDate" type="date" className="input" defaultValue={v.passedDate} />
            </Field>
          ) : null}
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="text-xl font-semibold sm:col-span-2">3. Thông tin của bạn</h2>
          <Field label="Họ tên *" htmlFor="customerName" error={e.customerName}>
            <input id="customerName" name="customerName" maxLength={80} autoComplete="name" className="input" defaultValue={v.customerName} />
          </Field>
          <Field label="Số điện thoại *" htmlFor="phone" error={e.phone}>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" className="input" defaultValue={v.phone} />
          </Field>
          <Field
            label="Email"
            htmlFor="email"
            error={e.email}
            hint="Để nhận xác nhận đơn và tự quản lý trang của bé sau này."
            className="sm:col-span-2"
          >
            <input id="email" name="email" type="email" autoComplete="email" className="input" defaultValue={v.email} />
          </Field>
          <Field label="Địa chỉ nhận hàng *" htmlFor="address" error={e.address} className="sm:col-span-2">
            <input id="address" name="address" maxLength={200} autoComplete="street-address" className="input" defaultValue={v.address} />
          </Field>
          <Field label="Ghi chú cho bọn tớ" htmlFor="note" error={e.note} className="sm:col-span-2">
            <textarea id="note" name="note" rows={3} maxLength={1000} className="input" defaultValue={v.note} />
          </Field>
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <p className="eyebrow">Tạm tính</p>
          <p className="mt-1 font-heading text-3xl font-bold">{amount ? vnd(amount) : "Chọn gói"}</p>
          <p className="mt-2 text-xs text-ink-soft">Phí giao hàng (nếu có) bọn tớ sẽ báo khi xác nhận đơn.</p>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input type="checkbox" name="agree" defaultChecked={v.agree === "on"} className="mt-1 accent-sage" />
            <span>
              Tôi đồng ý để Furever lưu thông tin này theo{" "}
              <Link href="/chinh-sach-bao-mat" target="_blank" className="underline">
                chính sách bảo mật
              </Link>
              .
            </span>
          </label>
          {e.agree ? <p className="mt-1 text-xs text-danger">{e.agree[0]}</p> : null}
          <div className="mt-4">
            <SubmitButton className="btn-primary w-full" pendingText="Đang gửi đơn…">
              Đặt hàng và thanh toán
            </SubmitButton>
          </div>
          <p className="mt-3 text-xs text-ink-soft">Bước tiếp theo hiện mã VietQR để chuyển khoản bằng app ngân hàng bất kỳ.</p>
        </div>
      </aside>
    </form>
  );
}
