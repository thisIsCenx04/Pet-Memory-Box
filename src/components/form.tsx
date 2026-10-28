import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const errId = `${htmlFor}-error`;
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && !error?.length ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
      {error?.length ? (
        <p id={errId} className="mt-1 text-xs font-medium text-danger">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

export function Notice({ state }: { state: { ok?: boolean; message?: string } }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-sage-soft text-sage-deep" : "bg-danger-soft text-danger"}`}
    >
      {state.message}
    </p>
  );
}

export function Section({
  title,
  description,
  children,
  actions,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
