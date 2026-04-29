"use client";

import { useEffect, useRef, useState } from "react";

type Cta = {
  label: string;
  href: string;
  external?: boolean;
  comingSoon?: boolean;
};

const className =
  "inline-flex items-center justify-between rounded-full border border-[var(--color-paper)] px-5 py-3 text-xs font-light uppercase tracking-[0.25em] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]";

export default function CtaButton({ cta }: { cta: Cta }) {
  const [showSoon, setShowSoon] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (cta.comingSoon) {
    const handleClick = () => {
      setShowSoon(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowSoon(false), 1800);
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        aria-live="polite"
        className={className}
      >
        <span>{showSoon ? "Coming soon" : cta.label}</span>
        <span aria-hidden>{showSoon ? "✦" : "→"}</span>
      </button>
    );
  }

  const externalProps = cta.external
    ? { target: "_blank", rel: "noreferrer" as const }
    : {};

  return (
    <a href={cta.href} {...externalProps} className={className}>
      <span>{cta.label}</span>
      <span aria-hidden>→</span>
    </a>
  );
}
