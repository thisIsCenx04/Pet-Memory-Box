import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, PageHeader } from "@/components/admin/page-header";
import { PACKAGE_LABEL, formatDateTime } from "@/lib/format";
import { formatVnd, listOrderRequests, transferContent } from "@/lib/services/online-orders";
import { cancelOrderAction, convertOrderAction, markPaidAction } from "./actions";

export const metadata = { title: "Đơn đặt online" };

const STATUS = {
  pending_payment: { label: "Chờ thanh toán", tone: "peach" },
  paid: { label: "Đã thanh toán", tone: "sage" },
  converted: { label: "Đã tạo hồ sơ", tone: "sand" },
  cancelled: { label: "Đã hủy", tone: "danger" },
} as const;
type S = keyof typeof STATUS;

export default async function OnlineOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status && status in STATUS ? (status as S) : undefined;
  const orders = await listOrderRequests(filter);
  return (
    <>
      <PageHeader
        title="Đơn đặt online"
        description="Đối chiếu nội dung chuyển khoản trong app ngân hàng với mã đơn, rồi bấm Đã nhận tiền. Khách nhận email và trang thanh toán tự cập nhật."
      />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Lọc theo trạng thái">
        {([undefined, ...Object.keys(STATUS)] as (S | undefined)[]).map((s) => (
          <Link key={s ?? "all"} href={s ? `/admin/don-online?status=${s}` : "/admin/don-online"} className={filter === s ? "btn-primary" : "btn-outline"}>
            {s ? STATUS[s].label : "Tất cả"}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-soft">Chưa có đơn nào.</div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold">{o.code}</span>
                    <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge>
                    <span className="text-xs text-ink-soft">{formatDateTime(o.createdAt)}</span>
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {o.petName} · {PACKAGE_LABEL[o.package]} {o.amount ? `· ${formatVnd(o.amount)}` : ""}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {o.customerName} · {o.phone}
                    {o.email ? ` · ${o.email}` : ""}
                  </p>
                  <p className="text-sm text-ink-soft">{o.address}</p>
                  {o.note ? <p className="mt-1 text-sm">Ghi chú: {o.note}</p> : null}
                  <p className="mt-2 text-xs">
                    Nội dung chuyển khoản: <span className="font-mono font-semibold">{transferContent(o.code)}</span>
                    {o.paidAt ? ` · Xác nhận lúc ${formatDateTime(o.paidAt)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {o.status === "pending_payment" ? (
                    <ConfirmButton
                      action={markPaidAction.bind(null, o.id)}
                      confirmText={`Xác nhận đã nhận ${o.amount ? formatVnd(o.amount) : "tiền"} với nội dung ${transferContent(o.code)}?`}
                      className="btn-primary"
                    >
                      Đã nhận tiền
                    </ConfirmButton>
                  ) : null}
                  {o.status === "paid" ? (
                    <ConfirmButton
                      action={convertOrderAction.bind(null, o.id)}
                      confirmText="Tạo hồ sơ thú cưng và phát hành mã QR từ đơn này?"
                      className="btn-primary"
                    >
                      Tạo hồ sơ
                    </ConfirmButton>
                  ) : null}
                  {o.pet ? (
                    <Link href={`/admin/pets/${o.pet.id}`} className="btn-outline">
                      Hồ sơ {o.pet.cardNo}
                    </Link>
                  ) : null}
                  {o.status === "pending_payment" || o.status === "paid" ? (
                    <ConfirmButton action={cancelOrderAction.bind(null, o.id)} confirmText={`Hủy đơn ${o.code}?`} className="btn-danger">
                      Hủy
                    </ConfirmButton>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
