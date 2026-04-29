"use client";

import { useState } from "react";
import { ANIM } from "@/lib/animations";
import { site, type SectionId } from "@/lib/site";
import NavList from "./ui/NavList";
import SectionView from "./ui/SectionView";
import CtaButton from "./ui/CtaButton";

export default function RightPanel() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  return (
    <aside className="relative flex flex-col gap-10 overflow-y-auto bg-[var(--color-ink)] p-8 text-[var(--color-paper)] md:gap-12 md:p-12 lg:p-14">
      <div data-anim={ANIM.right}>
        {activeSection ? (
          <SectionView
            id={activeSection}
            onClose={() => setActiveSection(null)}
          />
        ) : (
          <NavList onOpenSection={setActiveSection} />
        )}
      </div>

      <div data-anim={ANIM.right} className="mt-auto flex flex-col gap-3">
        <CtaButton cta={site.cta} />
        <CtaButton cta={site.ctaSecondary} />
      </div>
    </aside>
  );
}
