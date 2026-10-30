"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { Field, Notice } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";

export function PublicInfoForm({
  action,
  defaults,
  memorial,
}: {
  action: (p: ActionState, fd: FormData) => Promise<ActionState>;
  defaults: { tagline: string; traits: string; note: string; coatColor: string };
  memorial: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Notice state={state} />
      <Field
        label={memorial ? "Câu tưởng niệm dưới tên bé" : "Câu ngắn dưới tên bé"}
        htmlFor="tagline"
        error={state.errors?.tagline}
        hint="Tối đa 80 ký tự."
      >
        <input id="tagline" name="tagline" maxLength={80} className="input" defaultValue={defaults.tagline} />
      </Field>
      <Field label="Màu lông" htmlFor="coatColor" error={state.errors?.coatColor}>
        <input id="coatColor" name="coatColor" maxLength={50} className="input" defaultValue={defaults.coatColor} />
      </Field>
      <Field label="Đặc điểm nhận dạng" htmlFor="traits" error={state.errors?.traits}>
        <input id="traits" name="traits" maxLength={200} className="input" defaultValue={defaults.traits} />
      </Field>
      <Field label="Lưu ý (tính cách, sức khỏe)" htmlFor="note" error={state.errors?.note} hint="Tối đa 1.000 ký tự.">
        <textarea id="note" name="note" rows={4} maxLength={1000} className="input" defaultValue={defaults.note} />
      </Field>
      <SubmitButton>Lưu</SubmitButton>
      <p className="text-xs text-ink-soft">Muốn đổi tên bé, số điện thoại hay địa chỉ, hãy nhắn cho bọn tớ.</p>
    </form>
  );
}
