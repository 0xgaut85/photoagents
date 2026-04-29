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
      { label: "Skill Tree", section: "skills" },
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
      body: `Imagine opening your laptop on a Monday morning and finding that the agent already knows. It knows which dashboard you check first. It knows the shape of your week, the people you owe replies to, the spreadsheet that hides the number you need before standup. It does not need to be told.

That is the future we are building toward, and the path to it is quieter than you would expect. No giant model running in a faraway data center pretending to be your assistant. No subscription tier that promises personalization but delivers a chat window. Just a small piece of software, running locally, that pays attention.

photo agent starts almost empty. A few tools, a thinking loop, the discipline to write down what worked. The first day with it feels light, almost too light. You give it tasks and it stumbles through them, learning your environment one click at a time. Then something quiet happens. By the end of the week, it stops asking questions you have already answered. By the end of the month, it has built itself into the exact shape of your work.

This is what we mean by a self-evolving agent. Not a model that gets bigger. A companion that gets sharper. One that compounds, in private, on your machine, in your direction. The longer you use it, the more of your world it understands, and the less anyone else's version of it could ever do for you.

Most software is finished the day it ships. photo agent is barely born. We invite you to grow it.`,
    },
    quickstart: {
      title: "Quick Start",
      body: `Before anything else, you will need an API key from any major LLM provider you trust. Claude, Gemini, Kimi, MiniMax, anything you already pay for. The agent borrows the model's intelligence; you keep the bill.

You will also need a photo API key. Plans start at $15/month and unlock the agent's eyes — the part that turns pixels into context it can actually act on.

Once both keys are ready, the rest is three commands and roughly two minutes.

1. Clone the repository and install the lean set of starter dependencies.
2. Drop your API keys into the local config file.
3. Launch.

That is the entire onboarding. There is no dashboard, no setup wizard, no orchestration to configure. The agent will install whatever else it needs the first time it needs it, and remember next time.

If you can run a Python file, you can run photo agent.`,
    },
    skills: {
      title: "Skill Tree",
      body: `Other agents forget. Every conversation begins from zero, every task is solved from scratch, every cleverness evaporates the moment the window closes.

photo agent forgets nothing useful. The first time it solves a problem, it pauses long enough to compress what worked into a small reusable Skill. A path through the chaos, written in its own hand.

Over weeks, those skills accumulate into something no one else has and no one else can have: a Skill Tree shaped by exactly the work you do. Your tools, your data sources, your habits, your shortcuts. A second mind that knows your terrain.

Underneath, a layered memory keeps things tidy. Core rules, a fast index, durable facts, task playbooks, archived sessions. The agent always knows what to load and what to leave alone, which is why it stays sharp on a tiny context window while other systems drown in their own history.

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
    href: "#",
    external: true,
    comingSoon: true,
  },
} as const;

export type SectionId = keyof typeof site.sections;

export type SiteConfig = typeof site;
