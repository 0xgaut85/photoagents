"use client";

import { useEffect, useMemo, useState } from "react";

type Options = {
  /** ms per character while typing forward. */
  typeSpeed?: number;
  /** ms per character while deleting. */
  deleteSpeed?: number;
  /** ms to hold the fully-typed word before deleting. */
  holdMs?: number;
  /** ms to pause between words once one is fully deleted. */
  betweenMs?: number;
};

/**
 * Cycles through `words` with a classic typewriter effect:
 *   type → hold → delete → next.
 * Returns the current visible substring.
 */
export function useTypewriter(
  words: readonly string[],
  {
    typeSpeed = 65,
    deleteSpeed = 35,
    holdMs = 1400,
    betweenMs = 250,
  }: Options = {}
) {
  const reduced = usePrefersReducedMotion();
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting" | "idle">(
    "typing"
  );

  useEffect(() => {
    if (words.length === 0 || reduced) return;
    const target = words[wordIndex % words.length];

    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (text.length < target.length) {
        timer = setTimeout(
          () => setText(target.slice(0, text.length + 1)),
          typeSpeed
        );
      } else {
        timer = setTimeout(() => setPhase("holding"), 0);
      }
    } else if (phase === "holding") {
      timer = setTimeout(() => setPhase("deleting"), holdMs);
    } else if (phase === "deleting") {
      if (text.length > 0) {
        timer = setTimeout(
          () => setText(target.slice(0, text.length - 1)),
          deleteSpeed
        );
      } else {
        timer = setTimeout(() => setPhase("idle"), 0);
      }
    } else if (phase === "idle") {
      timer = setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length);
        setPhase("typing");
      }, betweenMs);
    }

    return () => clearTimeout(timer);
  }, [
    text,
    phase,
    wordIndex,
    words,
    typeSpeed,
    deleteSpeed,
    holdMs,
    betweenMs,
    reduced,
  ]);

  // If user prefers reduced motion, just show the first word, no cycling.
  return reduced ? words[0] ?? "" : text;
}

function usePrefersReducedMotion() {
  const query = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null,
    []
  );
  const [prefers, setPrefers] = useState(() => !!query?.matches);
  useEffect(() => {
    if (!query) return;
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, [query]);
  return prefers;
}
