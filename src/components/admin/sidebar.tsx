"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { Wordmark } from "../paw-logo";

const GROUPS = [
  {
    label: "Quản lý",
    items: [
      { href: "/admin", label: "Tổng quan", exact: true },
      { href: "/admin/pets", label: "Hồ sơ thú cưng", exclude: "/admin/pets/new" },
      { href: "/admin/pets/new", label: "Đăng ký mới" },
      { href: "/admin/qr", label: "Mã QR đã phát hành" },
      { href: "/admin/don-online", label: "Đơn đặt online" },
      { href: "/admin/orders", label: "Đơn hàng hộp kỷ vật" },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/admin/settings", label: "Cài đặt trang web" },
      { href: "/admin/account", label: "Tài khoản admin" },
    ],
  },
] as const;

type Item = { href: string; label: string; exact?: boolean; exclude?: string };

function isActive(pathname: string, item: Item) {
  if (item.exact) return pathname === item.href;
  if (item.exclude && pathname.startsWith(item.exclude)) return false;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-full shrink-0 flex-col border-sand bg-paper lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:border-r">
      <div className="px-6 pt-6 pb-2">
        <Wordmark sub="QUẢN TRỊ" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Điều hướng quản trị">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="eyebrow px-3 pb-2">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-xl px-3 text-sm transition-colors ${
                        active ? "bg-sage-soft font-semibold text-sage-deep" : "text-ink hover:bg-sand"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-sand px-6 py-4">
        <p className="text-sm font-semibold">Admin</p>
        <p className="truncate text-xs text-ink-soft">{email}</p>
        <form action={logoutAction} className="mt-3">
          <button type="submit" className="btn-outline w-full">
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  );
}
