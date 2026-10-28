import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Sidebar email={admin.email} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
