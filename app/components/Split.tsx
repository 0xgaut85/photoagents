"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { createIntroTimeline } from "@/lib/animations";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";

export default function Split() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      createIntroTimeline();
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={rootRef}
      className="grid h-dvh w-screen grid-cols-1 grid-rows-[2fr_1fr] overflow-hidden md:grid-cols-3 md:grid-rows-1"
    >
      <LeftPanel />
      <RightPanel />
    </main>
  );
}
