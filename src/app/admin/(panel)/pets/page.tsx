import Link from "next/link";
import { Badge, PageHeader } from "@/components/admin/page-header";
import { ORDER_STATUS_LABEL, QR_STATUS_LABEL, formatDateTime } from "@/lib/format";
import { listPets } from "@/lib/services/pets";

type SP = { q?: string; status?: string; qrStatus?: string; page?: string };

const PET_STATUSES = { active: "Đang hiển thị", archived: "Đã lưu trữ" } as const;

export default async function PetsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = sp.status && sp.status in PET_STATUSES ? (sp.status as keyof typeof PET_STATUSES) : undefined;
  const qrStatus = sp.qrStatus && sp.qrStatus in QR_STATUS_LABEL ? (sp.qrStatus as keyof typeof QR_STATUS_LABEL) : undefined;
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1;
  const { items, total, pageSize } = await listPets({ q: sp.q, status, qrStatus, page });
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { q: sp.q, status, qrStatus, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <PageHeader
        title="Hồ sơ thú cưng"
        description={`${total.toLocaleString("vi-VN")} hồ sơ`}
        actions={
          <Link href="/admin/pets/new" className="btn-primary">
            Đăng ký mới
          </Link>
        }
      />
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4" role="search">
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="label">
            Tìm kiếm
          </label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q}
            className="input"
            placeholder="Mã thẻ, tên bé, tên chủ hoặc số điện thoại"
          />
        </div>
        <div>
          <label htmlFor="status" className="label">
            Hồ sơ
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className="input">
            <option value="">Tất cả</option>
            {Object.entries(PET_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="qrStatus" className="label">
            Mã QR
          </label>
          <select id="qrStatus" name="qrStatus" defaultValue={qrStatus ?? ""} className="input">
            <option value="">Tất cả</option>
            <option value="active">{QR_STATUS_LABEL.active}</option>
            <option value="locked">{QR_STATUS_LABEL.locked}</option>
          </select>
        </div>
        <button type="submit" className="btn-outline">
          Lọc
        </button>
      </form>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold">Không tìm thấy hồ sơ phù hợp</p>
          <p className="mt-1 text-sm text-ink-soft">Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-sand text-left">
                {["Mã thẻ", "Tên bé", "Chủ nuôi", "Mã QR", "Đơn hàng", "Ngày tạo"].map((h) => (
                  <th key={h} scope="col" className="eyebrow px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {items.map((p) => {
                const tag = p.qrTags[0];
                return (
                  <tr key={p.id} className="hover:bg-cream/60">
                    <td className="px-4 py-3 font-mono">
                      <Link href={`/admin/pets/${p.id}`} className="hover:underline">
                        {p.cardNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/pets/${p.id}`} className="font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <div className="mt-0.5 flex gap-1">
                        {p.status === "archived" ? <Badge>Đã lưu trữ</Badge> : null}
                        {p.lifeStatus === "memorial" ? <Badge tone="peach">Tưởng niệm</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.owner.fullName}
                      <div className="text-xs text-ink-soft">{p.owner.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      {tag ? (
                        <Badge tone={tag.status === "active" ? "sage" : "danger"}>{QR_STATUS_LABEL[tag.status]}</Badge>
                      ) : (
                        <Badge>Chưa có</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{p.orders[0] ? ORDER_STATUS_LABEL[p.orders[0].status] : "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(p.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Phân trang">
          <span className="text-ink-soft">
            Trang {page}/{pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link className="btn-outline" href={`/admin/pets${qs({ page: String(page - 1) })}`}>
                Trang trước
              </Link>
            ) : null}
            {page < pages ? (
              <Link className="btn-outline" href={`/admin/pets${qs({ page: String(page + 1) })}`}>
                Trang sau
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
