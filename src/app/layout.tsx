import type { Metadata, Viewport } from "next";
import { baloo, beVietnam, patrick } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pet Memory Box", template: "%s · Pet Memory Box" },
  description: "Hộp kỷ vật và trang Digital Memory riêng cho thú cưng, mở bằng mã QR trên vòng cổ.",
};

export const viewport: Viewport = {
  themeColor: "#f6efe4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${baloo.variable} ${beVietnam.variable} ${patrick.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
