"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Hiện dần phần tử khi cuộn tới. CSS ẩn ban đầu chỉ áp dụng khi html có lớp `js`,
 * nên nội dung vẫn hiển thị nếu trình duyệt tắt JavaScript.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  variant = "up",
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  variant?: "up" | "left" | "right" | "scale";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      data-reveal={variant === "up" ? "" : variant}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
