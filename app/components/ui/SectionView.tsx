import { site, type SectionId } from "@/lib/site";

export default function SectionView({
  id,
  onClose,
}: {
  id: SectionId;
  onClose: () => void;
}) {
  const section = site.sections[id];
  const paragraphs = section.body.split(/\n\s*\n/).map((p) => p.trim());

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onClose}
        className="group inline-flex items-center gap-2 self-start text-xs font-light uppercase tracking-[0.25em] opacity-60 transition-opacity hover:opacity-100"
      >
        <span
          aria-hidden
          className="transition-transform group-hover:-translate-x-1"
        >
          ←
        </span>
        <span>Back</span>
      </button>

      <h2 className="text-3xl font-extralight tracking-[-0.02em] md:text-4xl">
        {section.title}
      </h2>

      <div className="flex flex-col gap-4 text-sm font-light leading-relaxed opacity-80 md:text-base">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
