import { formatDateTime } from "@/lib/format";

type Scan = { scannedAt: Date; result: string };
type Report = {
  id: string;
  createdAt: Date;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  message: string | null;
  finderContact: string | null;
};

const RESULT = { ok: "Mở trang", locked: "Mã đang khóa", replaced: "Mã cũ", archived: "Hồ sơ lưu trữ", not_found: "Không tồn tại" } as Record<
  string,
  string
>;

/** Lượt quét và tin báo tìm thấy; dùng cho cổng chủ nuôi và trang admin. */
export function FoundReports({ reports }: { reports: Report[] }) {
  if (!reports.length) return <p className="text-sm text-ink-soft">Chưa có ai gửi vị trí hay lời nhắn.</p>;
  return (
    <ul className="space-y-3">
      {reports.map((r) => (
        <li key={r.id} className="rounded-2xl border border-sand bg-white p-4 text-sm">
          <p className="text-xs text-ink-soft">{formatDateTime(r.createdAt)}</p>
          {r.latitude != null && r.longitude != null ? (
            <a
              href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
              target="_blank"
              rel="noopener"
              className="mt-1 inline-flex font-semibold text-sage-deep underline"
            >
              Xem vị trí trên bản đồ{r.accuracyM ? ` (sai số ~${r.accuracyM} m)` : ""}
            </a>
          ) : (
            <p className="mt-1 text-ink-soft">Không kèm vị trí</p>
          )}
          {r.message ? <p className="mt-2 whitespace-pre-line">{r.message}</p> : null}
          {r.finderContact ? (
            <p className="mt-2">
              Liên lạc người nhặt:{" "}
              <a href={`tel:${r.finderContact.replace(/[^\d+]/g, "")}`} className="font-semibold underline">
                {r.finderContact}
              </a>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ScanList({ scans, count7d }: { scans: Scan[]; count7d: number }) {
  return (
    <div>
      <p className="text-sm">
        <span className="font-heading text-3xl font-bold">{count7d}</span>{" "}
        <span className="text-ink-soft">lượt mở trang trong 7 ngày qua</span>
      </p>
      {scans.length ? (
        <ul className="mt-3 divide-y divide-sand text-sm">
          {scans.map((s, i) => (
            <li key={i} className="flex justify-between py-2">
              <span>{formatDateTime(s.scannedAt)}</span>
              <span className="text-ink-soft">{RESULT[s.result] ?? s.result}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">Chưa có lượt quét nào trong 30 ngày qua.</p>
      )}
    </div>
  );
}
