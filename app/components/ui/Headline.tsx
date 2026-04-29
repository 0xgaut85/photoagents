"use client";

import { useMemo } from "react";
import { ANIM } from "@/lib/animations";
import { site } from "@/lib/site";
import { useTypewriter } from "@/lib/useTypewriter";

export default function Headline() {
  const { accent, rest } = site.headline;
  const word = useTypewriter(accent, {
    typeSpeed: 95,
    deleteSpeed: 55,
    holdMs: 2200,
    betweenMs: 450,
  });

  // Reserve width for the longest word so "agents." never shifts as the
  // cycling word grows / shrinks.
  const widest = useMemo(
    () => accent.reduce((a, b) => (a.length >= b.length ? a : b), ""),
    [accent]
  );

  return (
    <h1
      data-anim={ANIM.headline}
      className="text-5xl font-extralight leading-[0.95] tracking-[-0.04em] md:text-6xl lg:text-7xl"
    >
      <span className="relative inline-block align-baseline italic font-light">
        {/* Ghost text reserves the widest possible width — invisible. */}
        <span aria-hidden className="invisible whitespace-pre">
          {widest}
        </span>
        {/* Live typewriter text overlays the ghost, left-aligned. */}
        <span className="absolute inset-y-0 left-0 whitespace-pre">
          {word}
          <span className="inline-block w-[0.05em] -translate-y-[0.05em] animate-caret-blink not-italic">
            |
          </span>
        </span>
      </span>{" "}
      <span>{rest}</span>
    </h1>
  );
}
