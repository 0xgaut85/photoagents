"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[2rem] border border-[var(--color-line)] bg-white/70 p-6 shadow-[0_24px_80px_rgba(14,18,16,0.06)] ${className}`}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-[var(--color-ink)] text-[var(--color-canvas)] hover:opacity-90",
    secondary:
      "border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)]",
    ghost: "text-[var(--color-ink)] hover:bg-[var(--color-line)]/60",
    danger: "bg-[#451b17] text-[var(--color-canvas)] hover:opacity-90",
  };

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-light transition ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[var(--color-line)] bg-white/80 px-4 py-3 text-sm font-light text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-ink)] ${className}`}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "border-[var(--color-line)] bg-white text-[var(--color-muted)]",
    success: "border-[#b7d7c2] bg-[#edf7ef] text-[#315b3f]",
    warning: "border-[#decf9a] bg-[#fbf5d9] text-[#6b5d22]",
    danger: "border-[#e3bbb3] bg-[#fbede9] text-[#7a3025]",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-light ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-white/60">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-[var(--color-line)] px-5 py-4 font-light">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-[var(--color-line)] last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-5 py-4 font-light">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card className="flex min-h-36 flex-col justify-between">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
        {label}
      </p>
      <div>
        <p className="text-4xl font-extralight tracking-[-0.04em]">{value}</p>
        {detail ? <p className="mt-2 text-sm text-[var(--color-muted)]">{detail}</p> : null}
      </div>
    </Card>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--color-line)] p-8 text-center">
      <h3 className="text-xl font-extralight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
        {children}
      </p>
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-canvas)] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-extralight tracking-[-0.03em]">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
