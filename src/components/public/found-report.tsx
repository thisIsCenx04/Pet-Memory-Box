"use client";

import { useState } from "react";

type Loc = { latitude: number; longitude: number; accuracyM: number };

/** Người nhặt được bé gửi vị trí và lời nhắn cho chủ nuôi (vị trí không hiển thị công khai). */
export function FoundReport({ token, name }: { token: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [loc, setLoc] = useState<Loc | null>(null);
  const [locState, setLocState] = useState<"idle" | "asking" | "denied" | "error">("idle");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  function shareLocation() {
    if (!("geolocation" in navigator)) return setLocState("error");
    setLocState("asking");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracyM: p.coords.accuracy });
        setLocState("idle");
      },
      (e) => setLocState(e.code === e.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  async function send() {
    setError(null);
    if (!loc && !message.trim() && !contact.trim()) {
      setError("Hãy chia sẻ vị trí hoặc để lại lời nhắn.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(`/api/public/pets/${token}/found`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(loc ?? {}), message: message.trim() || null, finderContact: contact.trim() || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Chưa gửi được, vui lòng thử lại");
      }
      setStatus("sent");
    } catch (e) {
      setError((e as Error).message);
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="animate-fade mt-4 rounded-2xl bg-sage-soft p-4 text-left text-sm text-sage-deep">
        <p className="font-semibold">Đã gửi cho chủ nuôi của {name}. Cảm ơn bạn rất nhiều!</p>
        <p className="mt-1">Nếu được, bạn hãy giữ bé ở nơi an toàn và gọi cho chủ nuôi bằng nút phía trên.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-outline mt-2 min-h-12 w-full text-base">
        Tôi đang thấy bé, gửi vị trí cho chủ
      </button>
    );
  }

  return (
    <div className="animate-fade mt-4 space-y-3 rounded-2xl border border-sand bg-paper p-4 text-left">
      <p className="text-sm">
        Vị trí và lời nhắn chỉ gửi riêng cho chủ nuôi qua email, không hiện trên trang này.
      </p>
      <div>
        <button type="button" onClick={shareLocation} disabled={locState === "asking"} className="btn-primary w-full">
          {locState === "asking" ? "Đang lấy vị trí…" : loc ? "Lấy lại vị trí" : "Chia sẻ vị trí hiện tại"}
        </button>
        {loc ? (
          <p className="mt-2 text-xs text-sage-deep">Đã có vị trí (sai số khoảng {Math.round(loc.accuracyM)} m).</p>
        ) : null}
        {locState === "denied" ? (
          <p className="mt-2 text-xs text-danger">
            Trình duyệt chưa cho phép lấy vị trí. Bạn có thể bật quyền vị trí cho trang này, hoặc ghi địa điểm vào lời nhắn.
          </p>
        ) : null}
        {locState === "error" ? (
          <p className="mt-2 text-xs text-danger">Không lấy được vị trí. Hãy ghi địa điểm vào lời nhắn.</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="found-message" className="label">
          Lời nhắn (không bắt buộc)
        </label>
        <textarea
          id="found-message"
          rows={3}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ví dụ: Bé đang ở trước cổng trường, mình giữ bé tới 6 giờ chiều."
          className="input"
        />
      </div>
      <div>
        <label htmlFor="found-contact" className="label">
          Số điện thoại của bạn (không bắt buộc)
        </label>
        <input
          id="found-contact"
          type="tel"
          inputMode="tel"
          maxLength={100}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="input"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="button" onClick={send} disabled={status === "sending"} className="btn-primary flex-1">
          {status === "sending" ? "Đang gửi…" : "Gửi cho chủ nuôi"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline">
          Đóng
        </button>
      </div>
    </div>
  );
}
