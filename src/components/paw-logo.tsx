/** Logo dấu chân vẽ riêng (SRS 15.4: không dùng bộ icon có sẵn). */
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

export function Wordmark({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "cream" }) {
  const text = tone === "cream" ? "text-cream" : "text-ink";
  const mark = tone === "cream" ? "text-peach" : "text-ink";
  return (
    <span className={`inline-flex items-center gap-2 font-heading text-[15px] font-bold tracking-wide ${text} ${className}`}>
      <PawMark className={`h-5 w-5 ${mark}`} />
      PET MEMORY BOX
    </span>
  );
}
