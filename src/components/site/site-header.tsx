"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/paw-logo";

const NAV = [
  { href: "/#ben-trong-hop", label: "Bên trong hộp" },
  { href: "/#digital-memory", label: "Digital Memory" },
  { href: "/#cach-hoat-dong", label: "Cách hoạt động" },
  { href: "/#hoi-dap", label: "Hỏi đáp" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-[background-color,box-shadow,padding] duration-300 ${
        scrolled || open ? "bg-cream/95 shadow-[0_1px_0_var(--color-sand),0_10px_30px_-24px_rgb(63_51_41/0.5)] backdrop-blur" : "bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-[padding] duration-300 sm:px-6 ${
          scrolled ? "py-2.5" : "py-4"
        }`}
      >
        <Link href="/" aria-label="Furever, về trang chủ">
          <Wordmark />
        </Link>
        <nav className="hidden gap-7 text-sm md:flex" aria-label="Mục trang">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="link-underline py-1 hover:text-sage-deep">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/chu-nuoi/dang-nhap" className="link-underline hidden px-2 py-1 text-sm lg:inline">
            Chủ nuôi
          </Link>
          <Link href="/dat-hang" className="btn-primary hidden sm:inline-flex">
            Đặt hộp cho bé
          </Link>
          <button
            type="button"
            className="btn-outline px-4 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Đóng" : "Menu"}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-nav" className="animate-fade border-t border-sand px-4 pb-4 md:hidden" aria-label="Mục trang">
          <ul className="divide-y divide-sand">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center text-base">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/chu-nuoi/dang-nhap" onClick={() => setOpen(false)} className="flex min-h-12 items-center text-base">
            Trang chủ nuôi
          </Link>
          <Link href="/dat-hang" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full">
            Đặt hộp cho bé
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
