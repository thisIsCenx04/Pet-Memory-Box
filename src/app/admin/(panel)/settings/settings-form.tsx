"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { Field, Notice } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";

const FIELDS = [
  { name: "zalo_url", label: "Liên kết Zalo", type: "url", hint: "Ví dụ: https://zalo.me/0901234567" },
  { name: "messenger_url", label: "Liên kết Messenger", type: "url", hint: "Ví dụ: https://m.me/tenfanpage" },
  { name: "hotline", label: "Số điện thoại hotline", type: "tel", hint: "Hiện ở chân trang và trang mã không khả dụng." },
  { name: "contact_email", label: "Email liên hệ", type: "email" },
  { name: "facebook_url", label: "Trang Facebook", type: "url" },
  { name: "tiktok_url", label: "Kênh TikTok", type: "url" },
  { name: "service_area", label: "Khu vực phục vụ", type: "text", hint: "Ví dụ: Giao hàng toàn quốc, làm hộp tại TP.HCM" },
] as const;

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
    <form action={formAction} className="card space-y-4 p-6" noValidate>
      <Notice state={state} />
      {FIELDS.map((f) => (
        <Field key={f.name} label={f.label} htmlFor={f.name} error={state.errors?.[f.name]} hint={"hint" in f ? f.hint : undefined}>
          <input id={f.name} name={f.name} type={f.type} className="input" defaultValue={v[f.name]} />
        </Field>
      ))}
      <SubmitButton>Lưu cài đặt</SubmitButton>
    </form>
  );
}
