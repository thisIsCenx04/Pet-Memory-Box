"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/admin/actions";
import { Field, Notice } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <Notice state={state} />
      <Field label="Email" htmlFor="email" error={state.errors?.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input"
          defaultValue={state.values?.email}
          aria-invalid={!!state.errors?.email}
        />
      </Field>
      <Field label="Mật khẩu" htmlFor="password" error={state.errors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          aria-invalid={!!state.errors?.password}
        />
      </Field>
      <SubmitButton className="btn-primary w-full" pendingText="Đang đăng nhập…">
        Đăng nhập
      </SubmitButton>
    </form>
  );
}
