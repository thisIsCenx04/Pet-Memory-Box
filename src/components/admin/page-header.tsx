import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
}: {
  title: string;
  description?: ReactNode;
  crumbs?: { href?: string; label: string }[];
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {crumbs ? (
          <nav aria-label="Vị trí" className="mb-2 text-sm text-ink-soft">
            {crumbs.map((c, i) => (
              <span key={i}>
                {i > 0 ? " / " : ""}
                {c.href ? (
                  <Link href={c.href} className="hover:text-ink hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-3xl font-bold">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

const TONE = {
  sage: "bg-sage-soft text-sage-deep",
  peach: "bg-peach-soft text-rust",
  sand: "bg-sand text-ink-soft",
  danger: "bg-danger-soft text-danger",
} as const;

export function Badge({ tone = "sand", children }: { tone?: keyof typeof TONE; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}>
      {children}
    </span>
  );
}
