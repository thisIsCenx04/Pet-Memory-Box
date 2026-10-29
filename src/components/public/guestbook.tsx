"use client";

import { useState } from "react";

function vnDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Sổ lưu bút trên trang tưởng niệm; lời nhắn mới chờ gia đình duyệt. */
export function Guestbook({
  token,
  name,
  entries,
}: {
  token?: string;
  name: string;
  entries: { name: string; message: string; date: string }[];
}) {
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setState("sending");
    try {
      const res = await fetch(`/api/public/pets/${token}/guestbook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ authorName: author, message, website: hp }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Chưa gửi được, vui lòng thử lại");
      }
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  return (
    <section className="mt-10 px-4" aria-labelledby="guestbook-title">
      <h2 id="guestbook-title" className="text-center text-2xl font-bold">
        Sổ lưu bút
      </h2>
      <p className="mt-1 text-center text-sm text-ink-soft">Những lời nhắn gửi tới {name}</p>

      {entries.length ? (
        <ul className="mt-5 space-y-3">
          {entries.map((g, i) => (
            <li key={i} className="rounded-2xl border border-sand bg-paper p-4">
              <p className="text-sm leading-relaxed whitespace-pre-line">{g.message}</p>
              <p className="mt-2 text-xs text-ink-soft">
                {g.name} · {vnDate(g.date)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-center text-sm text-ink-soft">Hãy là người đầu tiên để lại lời nhắn.</p>
      )}

      {token ? (
        state === "sent" ? (
          <p role="status" className="animate-fade mt-5 rounded-2xl bg-sage-soft p-4 text-sm text-sage-deep">
            Cảm ơn bạn. Lời nhắn sẽ hiện ở đây sau khi gia đình của {name} đọc và duyệt.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl border border-sand bg-paper p-4">
            <div>
              <label htmlFor="gb-name" className="label">
                Tên của bạn
              </label>
              <input
                id="gb-name"
                required
                maxLength={50}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="gb-message" className="label">
                Lời nhắn
              </label>
              <textarea
                id="gb-message"
                required
                rows={4}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input"
              />
            </div>
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="gb-website">Website</label>
              <input id="gb-website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={state === "sending"} className="btn-primary w-full">
              {state === "sending" ? "Đang gửi…" : "Gửi lời nhắn"}
            </button>
            <p className="text-xs text-ink-soft">Lời nhắn được gia đình duyệt trước khi hiện công khai.</p>
          </form>
        )
      ) : null}
    </section>
  );
}
