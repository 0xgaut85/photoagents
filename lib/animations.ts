import gsap from "gsap";

/**
 * Selectors used by the intro timeline. Add a `data-anim={ANIM.x}`
 * attribute on any element to opt it into the animation.
 */
export const ANIM = {
  wordmark: "wordmark",
  headline: "headline",
  canvas: "canvas",
  right: "right",
  copyright: "copyright",
} as const;

const sel = (name: string) => `[data-anim='${name}']`;

/**
 * Build the landing-page intro timeline. Scoped via gsap.context so
 * cleanup is a single .revert() call from the caller.
 */
export function createIntroTimeline() {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.from(sel(ANIM.wordmark), { y: 24, opacity: 0, duration: 0.7 })
    .from(sel(ANIM.headline), { y: 32, opacity: 0, duration: 0.9 }, "-=0.5")
    .from(sel(ANIM.canvas), { opacity: 0, duration: 1.2 }, "-=0.7")
    .from(
      `${sel(ANIM.right)} > *`,
      { y: 12, opacity: 0, duration: 0.5, stagger: 0.08 },
      "-=0.9"
    )
    .from(sel(ANIM.copyright), { opacity: 0, duration: 0.5 }, "-=0.4");

  return tl;
}
