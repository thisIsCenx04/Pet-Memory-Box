"use client";

import { useActionState, useState } from "react";
import { createPetAction, type ActionState } from "@/app/admin/actions";
import {
  OwnerFields,
  PetInfoFields,
  VisibilityToggles,
  noContactLeft,
  type VisibilityName,
} from "@/components/admin/pet-fields";
import { CoverPicker } from "@/components/admin/cover-picker";
import { Field, Notice, Section } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";

const DEFAULT_VISIBILITY: Record<VisibilityName, boolean> = {
  showCallButton: true,
  showPhone: true,
  showPhone2: false,
  showArea: true,
  showAddress: false,
  showNote: true,
  showMedia: true,
  showMemories: true,
};

export function CreatePetForm({ nextCardNo, siteUrl }: { nextCardNo: string; siteUrl: string }) {
  const [state, action] = useActionState<ActionState, FormData>(createPetAction, {});
  const [visibility, setVisibility] = useState(DEFAULT_VISIBILITY);
  const [coverBusy, setCoverBusy] = useState(false);
  const v = state.values ?? {};
  const host = siteUrl.replace(/^https?:\/\//, "");

  return (
    <form action={action} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Notice state={state} />

        <Section title="Gói sản phẩm">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["full_box", "Pet Memory Box đầy đủ", "Hộp thiếc, kỷ vật, thẻ căn cước, vòng cổ QR"],
                ["tag_only", "Chỉ vòng cổ QR", "Vòng cổ gắn mã QR và trang Digital Memory"],
              ] as const
            ).map(([value, title, desc]) => (
              <label
                key={value}
                className="flex cursor-pointer gap-3 rounded-xl border border-sand-deep bg-white p-4 has-checked:border-sage has-checked:bg-sage-soft"
              >
                <input
                  type="radio"
                  name="package"
                  value={value}
                  defaultChecked={(v.package ?? "full_box") === value}
                  className="mt-1 accent-sage"
                />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-ink-soft">{desc}</span>
                </span>
              </label>
            ))}
          </div>
          <Field label="Ghi chú đơn hàng" htmlFor="orderNote" error={state.errors?.orderNote} className="mt-4">
            <textarea id="orderNote" name="orderNote" rows={2} className="input" maxLength={1000} defaultValue={v.orderNote} />
          </Field>
        </Section>

        <Section title="Thông tin của bé">
          <div className="mb-5">
            <CoverPicker onBusyChange={setCoverBusy} />
          </div>
          <PetInfoFields
            defaults={v}
            errors={state.errors}
            onLifeStatusChange={(life) => {
              // BR-09: bé đã mất thì mặc định tắt nút gọi và số điện thoại
              const alive = life === "alive";
              setVisibility((cur) => ({ ...cur, showCallButton: alive, showPhone: alive, showPhone2: false }));
            }}
          />
        </Section>

        <Section title="Chủ nuôi">
          <OwnerFields defaults={v} errors={state.errors} />
        </Section>

        <Section
          title="Hiển thị công khai khi quét mã"
          description="Chỉ những mục được chọn mới xuất hiện trên trang của bé. Xác nhận với chủ nuôi trước khi bật."
        >
          <VisibilityToggles checked={visibility} onChange={(name, val) => setVisibility((c) => ({ ...c, [name]: val }))} />
          {noContactLeft(visibility) ? (
            <p role="alert" className="mt-3 rounded-xl bg-peach-soft px-4 py-3 text-sm text-rust">
              Người quét sẽ không liên lạc được với chủ nuôi.
            </p>
          ) : null}
        </Section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="card p-5">
          <p className="eyebrow">Mã thẻ tiếp theo</p>
          <p className="mt-1 font-heading text-3xl font-bold">{nextCardNo}</p>
          <p className="mt-3 rounded-xl bg-cream px-3 py-2 font-mono text-xs break-all text-ink-soft">
            {host}/p/••••••••••••••••••••••
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            Đường dẫn trong QR dùng một mã bí mật 22 ký tự, không dùng mã thẻ, nên không ai đoán được trang của bé khác.
            Khi khách đổi số điện thoại hay thêm kỷ niệm, chỉ cần sửa hồ sơ, không cần in lại vòng.
          </p>
          {state.duplicateOf ? (
            <label className="mt-4 flex items-start gap-2 rounded-xl bg-peach-soft p-3 text-sm text-rust">
              <input type="checkbox" name="confirmDuplicate" className="mt-1 accent-sage" />
              Tôi đã kiểm tra, vẫn tạo hồ sơ mới dù trùng với {state.duplicateOf.cardNo}.
            </label>
          ) : null}
          <div className="mt-4">
            <SubmitButton className="btn-primary w-full" pendingText="Đang lưu và phát hành…" disabled={coverBusy}>
              {coverBusy ? "Đang tải ảnh đại diện…" : "Lưu và phát hành mã QR"}
            </SubmitButton>
          </div>
        </div>
      </aside>
    </form>
  );
}
