import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/paw-logo";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Wordmark />
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold">Đăng nhập quản trị</h1>
          <p className="mt-1 mb-6 text-sm text-ink-soft">Chỉ dành cho nhân sự vận hành Pet Memory Box.</p>
          <LoginForm next={next ?? ""} />
        </div>
      </div>
    </main>
  );
}
