"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { Field, Notice } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";

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
      <Field label="Liên kết Zalo" htmlFor="zalo_url" error={state.errors?.zalo_url} hint="Ví dụ: https://zalo.me/0901234567">
        <input id="zalo_url" name="zalo_url" type="url" className="input" defaultValue={v.zalo_url} />
      </Field>
      <Field
        label="Liên kết Messenger"
        htmlFor="messenger_url"
        error={state.errors?.messenger_url}
        hint="Ví dụ: https://m.me/tenfanpage"
      >
        <input id="messenger_url" name="messenger_url" type="url" className="input" defaultValue={v.messenger_url} />
      </Field>
      <Field label="Email liên hệ (chân trang)" htmlFor="contact_email" error={state.errors?.contact_email}>
        <input id="contact_email" name="contact_email" type="email" className="input" defaultValue={v.contact_email} />
      </Field>
      <SubmitButton>Lưu cài đặt</SubmitButton>
    </form>
  );
}
