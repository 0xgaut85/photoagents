import { ANIM } from "@/lib/animations";
import { site } from "@/lib/site";

export default function Copyright() {
  const text = site.copyright.replace(
    "{year}",
    String(new Date().getFullYear())
  );

  return (
    <span
      data-anim={ANIM.copyright}
      className="pointer-events-none absolute bottom-6 left-6 z-20 text-[10px] font-light uppercase tracking-[0.25em] opacity-70 md:bottom-10 md:left-10 md:text-xs"
    >
      {text}
    </span>
  );
}
