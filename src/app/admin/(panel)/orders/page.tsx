import Link from "next/link";
import { Badge, PageHeader } from "@/components/admin/page-header";
import { ORDER_STATUS_LABEL, PACKAGE_LABEL, formatDateTime } from "@/lib/format";
import { listOrders } from "@/lib/services/admin-data";

export const metadata = { title: "Đơn hàng hộp kỷ vật" };

type OrderStatusKey = keyof typeof ORDER_STATUS_LABEL;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status && status in ORDER_STATUS_LABEL ? (status as OrderStatusKey) : undefined;
  const orders = await listOrders(filter);
  return (
    <>
      <PageHeader title="Đơn hàng hộp kỷ vật" description="Cập nhật gói và trạng thái trong trang chi tiết hồ sơ." />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Lọc theo trạng thái">
        {([undefined, ...Object.keys(ORDER_STATUS_LABEL)] as (OrderStatusKey | undefined)[]).map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
            className={filter === s ? "btn-primary" : "btn-outline"}
          >
            {s ? ORDER_STATUS_LABEL[s] : "Tất cả"}
          </Link>
        ))}
      </nav>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-sand text-left">
              {["Mã thẻ", "Tên bé", "Chủ nuôi", "Gói", "Trạng thái", "Cập nhật", "Ghi chú"].map((h) => (
                <th key={h} scope="col" className="eyebrow px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono">
                  <Link href={`/admin/pets/${o.pet.id}?tab=qr`} className="hover:underline">
                    {o.pet.cardNo}
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold">{o.pet.name}</td>
                <td className="px-4 py-3">
                  {o.owner.fullName}
                  <div className="text-xs text-ink-soft">{o.owner.phone}</div>
                </td>
                <td className="px-4 py-3">{PACKAGE_LABEL[o.package]}</td>
                <td className="px-4 py-3">
                  <Badge tone={o.status === "delivered" ? "sage" : "peach"}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-ink-soft">{formatDateTime(o.statusChangedAt)}</td>
                <td className="max-w-56 truncate px-4 py-3 text-ink-soft">{o.note}</td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-soft">
                  Chưa có đơn hàng.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
