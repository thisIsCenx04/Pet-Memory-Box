import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteSettingsSafe } from "@/lib/services/admin-data";
import { getPricing } from "@/lib/services/online-orders";
import { OrderForm } from "./order-form";

export const metadata: Metadata = {
  title: "Đặt hộp cho bé",
  description: "Đặt Pet Memory Box hoặc vòng cổ QR của Furever và thanh toán bằng VietQR.",
};

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const [pricing, settings] = await Promise.all([getPricing(), getSiteSettingsSafe()]);
  const open = pricing.full_box || pricing.tag_only;
  return (
    <>
      <span id="top" />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow">Đặt hàng</p>
        <h1 className="animate-rise mt-2 text-4xl font-bold sm:text-5xl">Đặt hộp cho bé</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Điền thông tin, thanh toán bằng mã VietQR, rồi gửi ảnh và kỷ vật của bé cho bọn tớ qua Zalo hoặc Messenger. Bọn tớ
          tạo trang Digital Memory và báo bạn khi hộp sẵn sàng.
        </p>
        {open ? (
          <OrderForm pricing={pricing} />
        ) : (
          <div className="card mt-8 p-6">
            <p className="font-semibold">Đặt hàng online đang tạm đóng.</p>
            <p className="mt-1 text-sm text-ink-soft">Bạn nhắn cho bọn tớ để được tư vấn gói và giá nhé.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {settings.zalo_url ? (
                <a href={settings.zalo_url} target="_blank" rel="noopener" className="btn-primary">
                  Nhắn qua Zalo
                </a>
              ) : null}
              {settings.facebook_url || settings.messenger_url ? (
                <a href={settings.messenger_url || settings.facebook_url} target="_blank" rel="noopener" className="btn-outline">
                  Nhắn qua Facebook
                </a>
              ) : null}
            </div>
          </div>
        )}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
