import Link from "next/link";
import { Wordmark } from "@/components/paw-logo";
import type { SiteSettings } from "@/lib/services/admin-data";

function prettyPhone(p: string) {
  return p.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-sans text-xs font-semibold tracking-[0.16em] text-peach uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const cls = "link-underline text-cream/80 hover:text-cream";
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noopener" className={cls}>
          {children}
        </a>
      ) : (
        <Link href={href} className={cls}>
          {children}
        </Link>
      )}
    </li>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const s = settings;
  const year = new Date().getFullYear();
  const contacts = [
    s.hotline ? { href: `tel:${s.hotline}`, label: `Hotline ${prettyPhone(s.hotline)}` } : null,
    s.contact_email ? { href: `mailto:${s.contact_email}`, label: s.contact_email } : null,
    s.zalo_url ? { href: s.zalo_url, label: "Nhắn qua Zalo", external: true } : null,
    s.messenger_url ? { href: s.messenger_url, label: "Nhắn qua Messenger", external: true } : null,
    s.facebook_url ? { href: s.facebook_url, label: "Facebook", external: true } : null,
    s.tiktok_url ? { href: s.tiktok_url, label: "TikTok", external: true } : null,
  ].filter((c): c is { href: string; label: string; external?: boolean } => c !== null);

  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="grid gap-10 border-b border-cream/15 pb-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Wordmark tone="cream" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">
              Hộp thiếc lưu giữ kỷ vật và vòng cổ gắn mã QR, mở ra trang Digital Memory riêng cho từng bé. Dành cho bé
              đang ở bên bạn, và cả những bé đã đi xa.
            </p>
            {s.service_area ? <p className="mt-3 text-sm text-cream/60">{s.service_area}</p> : null}
          </div>

          <Column title="Sản phẩm">
            <FooterLink href="/#ben-trong-hop">Bên trong hộp</FooterLink>
            <FooterLink href="/#digital-memory">Digital Memory</FooterLink>
            <FooterLink href="/#cach-hoat-dong">Cách hoạt động</FooterLink>
            <FooterLink href="/demo">Xem trang mẫu</FooterLink>
          </Column>

          <Column title="Hỗ trợ">
            <FooterLink href="/#hoi-dap">Hỏi đáp</FooterLink>
            <FooterLink href="/#hoi-dap">Mất vòng cổ thì làm gì?</FooterLink>
            <FooterLink href="/#lien-he">Đặt hộp cho bé</FooterLink>
            <FooterLink href="/chinh-sach-bao-mat">Chính sách bảo mật</FooterLink>
          </Column>

          {contacts.length ? (
            <Column title="Liên hệ">
              {contacts.map((c) => (
                <FooterLink key={c.href} href={c.href} external={c.external}>
                  {c.label}
                </FooterLink>
              ))}
            </Column>
          ) : null}
        </div>

        <p className="py-10 text-center font-hand text-2xl text-peach sm:text-3xl">
          Vì tình yêu thương luôn tồn tại, theo một cách khác.
        </p>

        <div className="flex flex-col gap-3 border-t border-cream/15 py-6 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Pet Memory Box. Thông tin trên trang của mỗi bé do chủ nuôi cung cấp.</p>
          <a href="#top" className="link-underline self-start text-cream/80 hover:text-cream sm:self-auto">
            Lên đầu trang
          </a>
        </div>
      </div>
    </footer>
  );
}
