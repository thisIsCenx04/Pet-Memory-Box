"use client";

import { useActionState, useEffect, useState } from "react";
import { requestOtpAction, verifyOtpAction, type OtpState } from "@/app/chu-nuoi/actions";
import { Field, Notice } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";

export function OtpForm() {
  const [sent, requestCode] = useActionState<OtpState, FormData>(requestOtpAction, { step: "email" });
  const [verify, verifyCode] = useActionState<OtpState, FormData>(verifyOtpAction, {});
  const [now, setNow] = useState(() => Date.now());
  const step = sent.step === "code" ? "code" : "email";
  const email = sent.email ?? sent.values?.email ?? "";

  const cooldown = sent.sentAt ? Math.min(60, Math.max(0, 60 - Math.floor((now - sent.sentAt) / 1000))) : 0;

  useEffect(() => {
    if (!sent.sentAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sent.sentAt]);

  if (step === "email") {
    return (
      <form action={requestCode} className="space-y-4" noValidate>
        <Notice state={sent} />
        <Field label="Email" htmlFor="owner-email" error={sent.errors?.email}>
          <input id="owner-email" name="email" type="email" autoComplete="email" required className="input" defaultValue={email} />
        </Field>
        <SubmitButton className="btn-primary w-full" pendingText="Đang gửi mã…">
          Gửi mã đăng nhập
        </SubmitButton>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <Notice state={verify.message ? verify : sent} />
      <form action={verifyCode} className="space-y-4" noValidate>
        <input type="hidden" name="email" value={email} />
        <Field label={`Mã 6 số gửi tới ${email}`} htmlFor="owner-code">
          <input
            id="owner-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            className="input text-center font-mono text-2xl tracking-[0.5em]"
          />
        </Field>
        <SubmitButton className="btn-primary w-full" pendingText="Đang kiểm tra…">
          Đăng nhập
        </SubmitButton>
      </form>
      <form action={requestCode}>
        <input type="hidden" name="email" value={email} />
        <button type="submit" className="btn-outline w-full" disabled={cooldown > 0}>
          {cooldown > 0 ? `Gửi lại mã sau ${cooldown} giây` : "Gửi lại mã"}
        </button>
      </form>
    </div>
  );
}
