import Image from "next/image";
import { ANIM } from "@/lib/animations";
import { site } from "@/lib/site";

export default function Wordmark() {
  return (
    <div
      data-anim={ANIM.wordmark}
      className="pointer-events-none absolute left-6 top-6 z-20 flex items-center gap-0 md:left-10 md:top-10 -ml-1 md:-ml-2"
    >
      <Image
        src={site.logo.src}
        alt={site.logo.alt}
        width={112}
        height={112}
        priority
        className="h-16 w-16 object-contain md:h-24 md:w-24"
      />
      <span className="-ml-1 text-2xl font-light tracking-[-0.04em] md:-ml-2 md:text-3xl">
        {site.brand}
      </span>
    </div>
  );
}
