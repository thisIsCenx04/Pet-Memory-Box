"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/app/admin/actions";

/** Nút chạy một Server Action sau khi admin xác nhận. */
export function ConfirmButton({
  action,
  confirmText,
  children,
  className = "btn-outline",
}: {
  action: () => Promise<ActionState | void>;
  confirmText: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  return (
    <div>
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmText)) return;
          start(async () => setResult((await action()) ?? null));
        }}
      >
        {pending ? "Đang xử lý…" : children}
      </button>
      {result?.message ? (
        <p role={result.ok ? "status" : "alert"} className={`mt-2 text-xs ${result.ok ? "text-sage-deep" : "text-danger"}`}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
