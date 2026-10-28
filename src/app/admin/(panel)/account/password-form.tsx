"use client";

import { useActionState } from "react";
import { changePasswordAction, type ActionState } from "@/app/admin/actions";
import { Field, Notice } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";

export function PasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="card space-y-4 p-6" noValidate>
      <h2 className="text-xl font-semibold">Đổi mật khẩu</h2>
      <Notice state={state} />
      <Field label="Mật khẩu hiện tại" htmlFor="currentPassword" error={state.errors?.currentPassword}>
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className="input" />
      </Field>
      <Field label="Mật khẩu mới" htmlFor="newPassword" error={state.errors?.newPassword} hint="Từ 8 ký tự, khác mật khẩu cũ.">
        <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" className="input" />
      </Field>
      <Field label="Nhập lại mật khẩu mới" htmlFor="confirmPassword" error={state.errors?.confirmPassword}>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className="input" />
      </Field>
      <SubmitButton pendingText="Đang đổi…">Đổi mật khẩu</SubmitButton>
    </form>
  );
}
