"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { Field, Notice } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";
import { BANKS } from "@/lib/vietqr";

type F = { name: string; label: string; type: string; hint?: string; inputMode?: "numeric" };

const GROUPS: { title: string; description?: string; fields: F[] }[] = [
  {
    title: "Liên hệ",
    description: "Hiện trên landing page và chân trang. Mục để trống sẽ tự ẩn.",
    fields: [
      { name: "zalo_url", label: "Liên kết Zalo", type: "url", hint: "Ví dụ: https://zalo.me/0901234567" },
      { name: "messenger_url", label: "Liên kết Messenger", type: "url", hint: "Ví dụ: https://m.me/tenfanpage" },
      { name: "hotline", label: "Số điện thoại hotline", type: "tel" },
      { name: "contact_email", label: "Email liên hệ", type: "email" },
      { name: "facebook_url", label: "Trang Facebook", type: "url" },
      { name: "tiktok_url", label: "Kênh TikTok", type: "url" },
      { name: "service_area", label: "Khu vực phục vụ", type: "text", hint: "Ví dụ: Giao hàng toàn quốc, làm hộp tại TP.HCM" },
    ],
  },
  {
    title: "Bảng giá",
    description: "Giá hiển thị ở trang đặt hàng và điền sẵn vào mã QR thanh toán. Để trống nếu chưa muốn bán gói đó online.",
    fields: [
      { name: "price_full_box", label: "Pet Memory Box đầy đủ (VND)", type: "text", inputMode: "numeric" },
      { name: "price_tag_only", label: "Chỉ vòng cổ QR (VND)", type: "text", inputMode: "numeric" },
    ],
  },
  {
    title: "Tài khoản nhận tiền",
    description: "Dùng để tạo mã VietQR trên trang thanh toán của mỗi đơn.",
    fields: [
      { name: "bank_account", label: "Số tài khoản", type: "text", inputMode: "numeric" },
      { name: "bank_account_name", label: "Tên chủ tài khoản", type: "text", hint: "Viết hoa, không dấu, đúng như trên app ngân hàng." },
    ],
  },
];

export function SettingsForm({
  action,
  defaults,
}: {
  action: (p: ActionState, fd: FormData) => Promise<ActionState>;
  defaults: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = state.values ?? defaults;
  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Notice state={state} />
      {GROUPS.map((g) => (
        <section key={g.title} className="card space-y-4 p-6">
          <div>
            <h2 className="text-xl font-semibold">{g.title}</h2>
            {g.description ? <p className="mt-1 text-sm text-ink-soft">{g.description}</p> : null}
          </div>
          {g.title === "Tài khoản nhận tiền" ? (
            <Field label="Ngân hàng" htmlFor="bank_bin" error={state.errors?.bank_bin}>
              <select id="bank_bin" name="bank_bin" className="input" defaultValue={v.bank_bin}>
                <option value="">Chưa chọn</option>
                {Object.entries(BANKS).map(([bin, name]) => (
                  <option key={bin} value={bin}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {g.fields.map((f) => (
            <Field key={f.name} label={f.label} htmlFor={f.name} error={state.errors?.[f.name]} hint={f.hint}>
              <input id={f.name} name={f.name} type={f.type} inputMode={f.inputMode} className="input" defaultValue={v[f.name]} />
            </Field>
          ))}
        </section>
      ))}
      <SubmitButton>Lưu cài đặt</SubmitButton>
    </form>
  );
}
