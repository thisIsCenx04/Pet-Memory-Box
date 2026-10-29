import Link from "next/link";
import { logoutOwnerAction } from "@/app/chu-nuoi/actions";
import { Wordmark } from "@/components/paw-logo";
import { requireOwner } from "@/lib/owner-auth";

export default async function OwnerPortalLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-sand bg-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/chu-nuoi">
            <Wordmark sub="CHỦ NUÔI" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-soft sm:inline">{owner.email}</span>
            <form action={logoutOwnerAction}>
              <button type="submit" className="btn-outline min-h-10 px-4">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
