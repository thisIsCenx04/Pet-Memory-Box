"use client";

import { useState, useTransition } from "react";
import { setNotifyScanAction } from "@/app/chu-nuoi/actions";

export function NotifyToggle({ petId, enabled, email }: { petId: string; enabled: boolean; email: string | null }) {
  const [on, setOn] = useState(enabled);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4">
        <span>
          <span className="block font-semibold">Email khi có người quét mã</span>
          <span className="block text-xs text-ink-soft">
            Gửi tới {email ?? "email của bạn"}, tối đa một email mỗi 30 phút.
          </span>
        </span>
        <input
          type="checkbox"
          checked={on}
          disabled={pending}
          onChange={(e) => {
            const v = e.target.checked;
            setOn(v);
            start(async () => {
              const r = await setNotifyScanAction(petId, v);
              setMsg(r.message ?? null);
            });
          }}
          className="h-5 w-5 shrink-0 accent-sage"
        />
      </label>
      {msg ? (
        <p role="status" className="text-xs text-sage-deep">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
