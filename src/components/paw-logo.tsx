/** Dấu chân vẽ tay, dùng trong hình minh họa hộp thiếc. */
export function PawMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="currentColor">
      <ellipse cx="16" cy="21.5" rx="7.2" ry="6.2" />
      <ellipse cx="7.2" cy="13.6" rx="3.1" ry="3.9" transform="rotate(-18 7.2 13.6)" />
      <ellipse cx="12.6" cy="7.6" rx="3.1" ry="4" transform="rotate(-6 12.6 7.6)" />
      <ellipse cx="19.4" cy="7.6" rx="3.1" ry="4" transform="rotate(6 19.4 7.6)" />
      <ellipse cx="24.8" cy="13.6" rx="3.1" ry="3.9" transform="rotate(18 24.8 13.6)" />
    </svg>
  );
}

/** Logo trái tim dấu chân của Furever. */
export function BrandMark({ className = "h-7 w-7", tone = "ink" }: { className?: string; tone?: "ink" | "cream" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === "cream" ? "/brand/furever-mark-cream.webp" : "/brand/furever-mark.webp"}
      alt=""
      aria-hidden="true"
      width={256}
      height={256}
      className={`object-contain ${className}`}
    />
  );
}

export function Wordmark({
  className = "",
  tone = "ink",
  sub,
}: {
  className?: string;
  tone?: "ink" | "cream";
  sub?: string;
}) {
  const text = tone === "cream" ? "text-cream" : "text-ink";
  return (
    <span className={`inline-flex items-center gap-2 ${text} ${className}`}>
      <BrandMark tone={tone} className="h-8 w-8" />
      <span className="leading-none">
        <span className="block font-heading text-lg font-bold tracking-wide">FUREVER</span>
        <span className={`block text-[10px] font-semibold tracking-[0.2em] ${tone === "cream" ? "text-cream/70" : "text-ink-soft"}`}>
          {sub ?? "PET MEMORY BOX"}
        </span>
      </span>
    </span>
  );
}

export function FullLogo({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "cream" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === "cream" ? "/brand/furever-logo-cream.webp" : "/brand/furever-logo.webp"}
      alt="Furever Pet Memory Box"
      width={600}
      height={700}
      className={className}
    />
  );
}
