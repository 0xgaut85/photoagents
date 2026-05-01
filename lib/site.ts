/**
 * Single source of truth for all editable site content.
 * Change copy, links, or nav items here. Nothing else needed.
 */

export const site = {
  brand: "photo",
  name: "photo agent",
  description: "photo agent. A self-evolving agent that grows with you.",
  logo: {
    src: "/logotransp.png",
    alt: "photo agent logo",
  },
  headline: {
    /** Words cycle through this list with a typewriter effect. */
    accent: [
      "Self-evolving",
      "Conscious",
      "Reflecting",
      "Adapting",
      "Reasoning",
      "Curious",
      "Learning",
      "Autonomous",
      "Emergent",
      "Sentient",
    ],
    rest: "agents.",
  },
  copyright: "© {year} photo",

  model: {
    src: "/polaroid_photo_sample.glb",
    photoTexture: "/polaroidimage.png",
  },

  social: {
    x: "https://x.com/photoagents",
  },

  nav: {
    label: "Project",
    links: [
      { label: "Overview", section: "overview" },
      { label: "Quick Start", section: "quickstart" },
      { label: "Memory", section: "skills" },
      { label: "X / Twitter", href: "https://x.com/photoagents", external: true },
      { label: "Get in touch", href: "https://x.com/merelnyc", external: true },
    ] as const,
  },

  /**
   * Section content shown in the right panel when its nav link is clicked.
   * Each entry's key matches the `section` field on the nav link.
   * `body` is rendered as paragraphs split on blank lines.
   */
  sections: {
    overview: {
      title: "Overview",
      body: `Imagine opening your laptop on a Monday morning and finding that the agent already knows. It knows which dashboard you check first, the people you owe replies to, the spreadsheet that hides the number you need before standup. It does not need to be told.

The path to that is quieter than you would expect. No giant model in a faraway data center pretending to be your assistant. No subscription tier that promises personalization and delivers a chat window. Just a small piece of software, running locally, that pays attention.

photo agent starts almost empty. A few tools, a thinking loop, the discipline to write down what worked. By the end of the week, it stops asking questions you have already answered. By the end of the month, it has built itself into the exact shape of your work.

This is what we mean by a self-evolving agent. Not a model that gets bigger. A companion that gets sharper. It watches the way you work and remembers the shape of it.

Most software is finished the day it ships. photo agent is barely born. We invite you to grow it.`,
    },
    quickstart: {
      title: "Quick Start",
      body: `Three commands, roughly two minutes.

1. Clone the repository and install the lean set of starter dependencies.
2. Drop your API keys into the local config file.
3. Launch.

You will need an API key from any major LLM provider you already trust: Claude, Gemini, Kimi, MiniMax. You will also need a photo API key, which unlocks the agent's eyes. Plans start at $15/month.

There is no setup wizard and no orchestration to configure. The agent installs whatever else it needs the first time it needs it, and remembers next time.

If you can run a Python file, you can run photo agent. The docs pick up the moment it boots.`,
    },
    skills: {
      title: "Memory",
      body: `Other agents forget. Every conversation begins from zero, every task is solved from scratch, every cleverness evaporates the moment the window closes.

photo agent forgets nothing useful. The first time it solves a problem, it pauses long enough to compress what worked into a small reusable skill. A path through the chaos, written in its own hand.

Over weeks, those skills accumulate into something no one else has and no one else can have: a private library shaped by exactly the work you do. Your tools, your data sources, your habits, your shortcuts. A second mind that knows your terrain.

Underneath, memory is filed in five layers — L0 reflexes, L1 a fast skill index, L2 durable facts, L3 task playbooks, L4 archived sessions. The agent loads only what it needs, which is why it stays sharp on a tiny context window while other systems drown in their own history.

The longer you use it, the less it costs you and the more it can do.`,
    },
  } as const,

  cta: {
    label: "View on GitHub",
    href: "https://github.com/lsdefine/GenericAgent",
    external: true,
    comingSoon: true,
  },

  ctaSecondary: {
    label: "Get an API key",
    href: "/dashboard",
    comingSoon: true,
  },
} as const;

export type SectionId = keyof typeof site.sections;

export type SiteConfig = typeof site;
