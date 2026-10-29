"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { moderateGuestbookAction } from "@/app/chu-nuoi/actions";

type Entry = { id: string; authorName: string; message: string; status: "pending" | "approved" | "rejected"; createdAt: string };

const STATUS = { pending: "Chờ duyệt", approved: "Đang hiện", rejected: "Đã ẩn" } as const;

/** Duyệt lời nhắn trong sổ lưu bút; dùng cho cả cổng chủ nuôi và trang admin. */
export function GuestbookModeration({ petId, entries }: { petId: string; entries: Entry[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (id: string, d: "approved" | "rejected" | "delete") =>
    start(async () => {
      if (d === "delete" && !window.confirm("Xóa hẳn lời nhắn này?")) return;
      await moderateGuestbookAction(petId, id, d);
      router.refresh();
    });

  if (!entries.length) return <p className="text-sm text-ink-soft">Chưa có lời nhắn nào.</p>;
  return (
    <ul className={`space-y-3 ${pending ? "opacity-80" : ""}`}>
      {entries.map((e) => (
        <li key={e.id} className="rounded-2xl border border-sand bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{e.authorName}</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                e.status === "approved" ? "bg-sage-soft text-sage-deep" : e.status === "pending" ? "bg-peach-soft text-rust" : "bg-sand text-ink-soft"
              }`}
            >
              {STATUS[e.status]}
            </span>
          </div>
          <p className="mt-2 text-sm whitespace-pre-line">{e.message}</p>
          <p className="mt-1 text-xs text-ink-soft">{new Date(e.createdAt).toLocaleString("vi-VN")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {e.status !== "approved" ? (
              <button type="button" className="btn-primary min-h-9 px-4 text-xs" onClick={() => act(e.id, "approved")}>
                Duyệt
              </button>
            ) : null}
            {e.status !== "rejected" ? (
              <button type="button" className="btn-outline min-h-9 px-4 text-xs" onClick={() => act(e.id, "rejected")}>
                Ẩn
              </button>
            ) : null}
            <button type="button" className="btn-danger min-h-9 px-4 text-xs" onClick={() => act(e.id, "delete")}>
              Xóa
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
