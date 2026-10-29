import Link from "next/link";
import { Badge, PageHeader } from "@/components/admin/page-header";
import { ORDER_STATUS_LABEL } from "@/lib/format";
import { getDashboard } from "@/lib/services/admin-data";

export default async function DashboardPage() {
  const d = await getDashboard();
  const stats = [
    { label: "Hồ sơ đang hiển thị", value: d.pets, href: "/admin/pets?status=active" },
    { label: "Mã QR đang hoạt động", value: d.activeTags, href: "/admin/qr?status=active" },
    { label: "Lượt quét 7 ngày qua", value: d.scans7d, href: "/admin/qr" },
    { label: "Đơn online chờ thanh toán", value: d.pendingPayments, href: "/admin/don-online?status=pending_payment" },
  ];
  return (
    <>
      <PageHeader
        title="Tổng quan"
        actions={
          <Link href="/admin/pets/new" className="btn-primary">
            Đăng ký mới
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 transition-colors hover:border-sand-deep">
            <p className="text-sm text-ink-soft">{s.label}</p>
            <p className="mt-1 font-heading text-4xl font-bold">{s.value.toLocaleString("vi-VN")}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Hồ sơ gần đây</h2>
            <Link href="/admin/pets" className="text-sm font-semibold text-sage hover:underline">
              Xem tất cả
            </Link>
          </div>
          {d.latest.length === 0 ? (
            <p className="py-6 text-sm text-ink-soft">
              Chưa có hồ sơ nào.{" "}
              <Link href="/admin/pets/new" className="font-semibold text-sage underline">
                Tạo hồ sơ đầu tiên
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-sand">
              {d.latest.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/pets/${p.id}`} className="flex items-center gap-4 py-3 hover:bg-cream/60">
                    <span className="w-28 font-mono text-sm">{p.cardNo}</span>
                    <span className="flex-1 font-semibold">{p.name}</span>
                    <span className="hidden flex-1 text-sm text-ink-soft sm:block">{p.owner.fullName}</span>
                    {p.orders[0] ? <Badge>{ORDER_STATUS_LABEL[p.orders[0].status]}</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-xl font-semibold">Đơn theo trạng thái</h2>
          <ul className="space-y-2">
            {(Object.keys(ORDER_STATUS_LABEL) as (keyof typeof ORDER_STATUS_LABEL)[]).map((k) => (
              <li key={k}>
                <Link
                  href={`/admin/orders?status=${k}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-sand"
                >
                  <span className="text-sm">{ORDER_STATUS_LABEL[k]}</span>
                  <span className="font-heading text-xl font-bold">{d.orders[k]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
