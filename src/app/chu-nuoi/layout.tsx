import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Trang chủ nuôi", template: "%s · Chủ nuôi · Furever" },
  robots: { index: false, follow: false },
};

export default function OwnerRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
