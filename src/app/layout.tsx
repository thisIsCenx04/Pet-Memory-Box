import type { Metadata, Viewport } from "next";
import { baloo, beVietnam, patrick } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Furever · Pet Memory Box", template: "%s · Furever" },
  description: "Furever: hộp kỷ vật và trang Digital Memory riêng cho thú cưng, mở bằng mã QR trên vòng cổ.",
  applicationName: "Furever",
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  openGraph: { siteName: "Furever", locale: "vi_VN", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f6efe4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${baloo.variable} ${beVietnam.variable} ${patrick.variable}`} suppressHydrationWarning>
      <head>
        {/* Đánh dấu JS đã chạy trước lần vẽ đầu tiên, để hiệu ứng hiện dần không làm nháy nội dung */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
