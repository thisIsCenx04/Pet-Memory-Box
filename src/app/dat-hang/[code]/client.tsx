"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="shrink-0 rounded-full border border-sand-deep px-2.5 py-0.5 text-xs font-semibold hover:bg-sand"
    >
      {done ? "Đã chép" : "Chép"}
    </button>
  );
}

/** Tải lại trạng thái đơn mỗi 15 giây để khách thấy ngay khi admin xác nhận đã nhận tiền. */
export function StatusPoller() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(t);
  }, [router]);
  return <p className="text-xs text-ink-soft">Đang chờ xác nhận thanh toán…</p>;
}
