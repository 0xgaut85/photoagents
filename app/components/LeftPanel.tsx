"use client";

import dynamic from "next/dynamic";
import { ANIM } from "@/lib/animations";
import Wordmark from "./ui/Wordmark";
import Copyright from "./ui/Copyright";
import Headline from "./ui/Headline";

const Polaroid = dynamic(() => import("./Polaroid"), { ssr: false });

export default function LeftPanel() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-paper)] text-[var(--color-ink)] md:col-span-2">
      {/* 3D scene — full-bleed background layer */}
      <div data-anim={ANIM.canvas} className="absolute inset-0 z-0">
        <Polaroid />
      </div>

      <Wordmark />
      <Copyright />

      {/* Headline overlay (text doesn't block pointer; links inside re-enable it) */}
      <div className="pointer-events-none relative z-10 flex h-full w-full items-center px-8 py-8 md:px-14 md:py-10 lg:px-20 lg:py-14">
        <div className="flex max-w-md flex-col gap-6">
          <Headline />
        </div>
      </div>
    </section>
  );
}
