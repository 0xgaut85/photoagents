import { site, type SectionId } from "@/lib/site";

export default function NavList({
  onOpenSection,
}: {
  onOpenSection: (id: SectionId) => void;
}) {
  return (
    <nav className="flex flex-col gap-3">
      <span className="mb-2 text-xs font-light uppercase tracking-[0.25em] opacity-60">
        {site.nav.label}
      </span>

      {site.nav.links.map((link) => {
        const className =
          "group flex items-baseline justify-between border-b border-[var(--color-paper)]/15 pb-2 text-xl font-extralight tracking-[-0.02em] transition-opacity hover:opacity-70 md:text-2xl";
        const arrow = (
          <span className="text-xs font-light opacity-50 transition-transform group-hover:translate-x-1">
            →
          </span>
        );

        // Internal section trigger.
        if ("section" in link) {
          return (
            <button
              key={link.label}
              type="button"
              onClick={() => onOpenSection(link.section as SectionId)}
              className={`${className} text-left`}
            >
              <span>{link.label}</span>
              {arrow}
            </button>
          );
        }

        // External link.
        const externalProps = link.external
          ? { target: "_blank", rel: "noreferrer" as const }
          : {};
        return (
          <a
            key={link.label}
            href={link.href}
            {...externalProps}
            className={className}
          >
            <span>{link.label}</span>
            {arrow}
          </a>
        );
      })}
    </nav>
  );
}
