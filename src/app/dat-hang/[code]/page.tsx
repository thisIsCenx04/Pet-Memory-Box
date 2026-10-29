import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/paw-logo";
import { GENDER_LABEL, PACKAGE_LABEL, SPECIES_LABEL } from "@/lib/format";
import { getSiteSettingsSafe } from "@/lib/services/admin-data";
import {
  formatVnd,
  getOrderForCustomer,
  getPaymentAccount,
  paymentQrDataUrl,
  transferContent,
} from "@/lib/services/online-orders";
import { CopyButton, StatusPoller } from "./client";

export const metadata: Metadata = { title: "Thanh toán đơn hàng", robots: { index: false, follow: false } };

export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { code } = await params;
  const { t } = await searchParams;
  const order = await getOrderForCustomer(code, t ?? "");
  if (!order) notFound();
  const [account, settings] = await Promise.all([getPaymentAccount(), getSiteSettingsSafe()]);
  const pending = order.status === "pending_payment";
  const qr = pending ? await paymentQrDataUrl(order.code, order.amount) : null;
  const content = transferContent(order.code);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/">
        <Wordmark />
      </Link>
      <h1 className="animate-rise mt-8 text-3xl font-bold sm:text-4xl">
        {pending ? "Thanh toán đơn hàng" : order.status === "cancelled" ? "Đơn đã hủy" : "Furever đã nhận thanh toán"}
      </h1>
      <p className="mt-2 text-ink-soft">
        Mã đơn <strong className="font-mono text-ink">{order.code}</strong> · {PACKAGE_LABEL[order.package]} cho bé{" "}
        <strong className="text-ink">{order.petName}</strong>
      </p>

      {pending ? (
        <div className="mt-8 grid gap-6 md:grid-cols-[300px_1fr]">
          <div className="card flex flex-col items-center p-5">
            {qr ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`Mã VietQR thanh toán đơn ${order.code}`} width={280} height={280} className="rounded-xl" />
                <p className="mt-2 text-center text-xs text-ink-soft">
                  Mở app ngân hàng, chọn quét mã QR. Số tiền và nội dung đã điền sẵn.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-soft">Furever chưa cài tài khoản nhận tiền, vui lòng nhắn để được hướng dẫn.</p>
            )}
          </div>
          <div className="card space-y-4 p-5">
            {account ? (
              <dl className="space-y-3 text-sm">
                <Row label="Ngân hàng" value={account.bankName} />
                <Row label="Số tài khoản" value={account.accountNumber} copy />
                <Row label="Chủ tài khoản" value={account.accountName} />
                {order.amount ? <Row label="Số tiền" value={formatVnd(order.amount)} copyValue={String(order.amount)} copy strong /> : null}
                <Row label="Nội dung" value={content} copy strong />
              </dl>
            ) : null}
            <p className="rounded-xl bg-peach-soft px-4 py-3 text-sm text-rust">
              Ghi đúng nội dung <strong>{content}</strong> để Furever đối chiếu nhanh. Trang này tự cập nhật khi Furever xác nhận đã
              nhận tiền.
            </p>
            <StatusPoller />
          </div>
        </div>
      ) : null}

      {order.status === "paid" || order.status === "converted" ? (
        <div className="card mt-8 space-y-3 p-6">
          <p>Cảm ơn bạn! Bước tiếp theo:</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>Gửi ảnh, video và câu chuyện của {order.petName} cho Furever qua Zalo hoặc Facebook.</li>
            <li>Furever làm hộp, in mã QR lên vòng cổ và báo bạn khi giao hàng.</li>
            {order.email ? (
              <li>
                Khi hồ sơ của bé được tạo, bạn đăng nhập bằng {order.email} ở{" "}
                <Link href="/chu-nuoi/dang-nhap" className="underline">
                  trang chủ nuôi
                </Link>{" "}
                để tự thêm ảnh và kỷ niệm.
              </li>
            ) : null}
          </ol>
          <div className="flex flex-wrap gap-2 pt-2">
            {settings.zalo_url ? (
              <a href={settings.zalo_url} target="_blank" rel="noopener" className="btn-primary">
                Gửi ảnh qua Zalo
              </a>
            ) : null}
            {settings.facebook_url ? (
              <a href={settings.messenger_url || settings.facebook_url} target="_blank" rel="noopener" className="btn-outline">
                Nhắn qua Facebook
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="card mt-6 p-5 text-sm">
        <h2 className="text-lg font-semibold">Thông tin đơn</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <Row label="Người đặt" value={`${order.customerName} · ${order.phone}`} />
          <Row label="Giao tới" value={order.address} />
          <Row label="Bé" value={`${order.petName} · ${SPECIES_LABEL[order.species]}${order.breed ? ` ${order.breed}` : ""} · ${GENDER_LABEL[order.gender]}`} />
          {order.amount ? <Row label="Số tiền" value={formatVnd(order.amount)} /> : null}
        </dl>
      </section>
      <p className="mt-4 text-xs text-ink-soft">Lưu lại đường dẫn trang này để xem trạng thái đơn.</p>
    </main>
  );
}

function Row({
  label,
  value,
  copy,
  copyValue,
  strong,
}: {
  label: string;
  value: string;
  copy?: boolean;
  copyValue?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`flex items-center gap-2 text-right ${strong ? "font-semibold" : ""}`}>
        <span className="break-all">{value}</span>
        {copy ? <CopyButton value={copyValue ?? value} /> : null}
      </dd>
    </div>
  );
}
