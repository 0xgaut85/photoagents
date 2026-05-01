"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { Button, Card, EmptyState, Table } from "../../_components/ui";
import { useDashboardAuth } from "../../_components/DashboardAuth";
import { fetchKeys, type ApiKey } from "../../_lib/api";

const snippets = {
  curl: (key: string) => `curl https://api.photoagents.ai/v1/vision/read \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"image_url":"https://example.com/screen.png"}'`,
  js: (key: string) => `const res = await fetch("https://api.photoagents.ai/v1/vision/read", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ image_url: "https://example.com/screen.png" }),
});`,
  python: (key: string) => `import requests

res = requests.post(
    "https://api.photoagents.ai/v1/vision/read",
    headers={"Authorization": "Bearer ${key}"},
    json={"image_url": "https://example.com/screen.png"},
)`,
};

type Lang = keyof typeof snippets;

const NAV_SECTIONS: { id: string; label: string }[] = [
  { id: "concepts", label: "Concepts" },
  { id: "quickstart", label: "Quickstart" },
  { id: "endpoints", label: "Endpoints" },
  { id: "memory", label: "Memory" },
  { id: "errors", label: "Errors" },
  { id: "limits", label: "Limits" },
  { id: "changelog", label: "Changelog" },
];

const READ_REQUEST = `POST /v1/vision/read
{
  "image_url": "https://example.com/screen.png",
  "return": ["text", "ui_tree", "regions"]
}`;

const READ_RESPONSE = `{
  "text": "Inbox · 3 unread\\nMonday standup at 10:00 …",
  "ui_tree": { "role": "window", "children": [ … ] },
  "regions": [
    { "label": "primary_button", "bbox": [820, 612, 188, 44] }
  ]
}`;

const DIFF_REQUEST = `POST /v1/vision/diff
{
  "before": { "image_url": "https://example.com/t0.png" },
  "after":  { "image_url": "https://example.com/t1.png" }
}`;

const DIFF_RESPONSE = `{
  "summary": "A modal opened over the dashboard with a 'Confirm payment' CTA.",
  "changed_regions": [
    { "bbox": [420, 240, 560, 360], "kind": "appeared" }
  ]
}`;

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
        {kicker}
      </p>
      <h2 className="mt-3 text-3xl font-extralight tracking-[-0.04em] md:text-4xl">
        {title}
      </h2>
    </>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-[1.5rem] bg-[var(--color-ink)] p-5 text-sm leading-relaxed text-[var(--color-canvas)]">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  const { apiFetch } = useDashboardAuth();
  const [lang, setLang] = useState<Lang>("curl");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys(apiFetch)
      .then((list) => setKeys(list))
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const activeKey = keys.find((k) => k.status === "active");
  const placeholderKey = "YOUR_API_KEY";
  const displayedKey = activeKey?.prefix.replace(/[•]/g, "x") ?? placeholderKey;
  const code = useMemo(() => snippets[lang](displayedKey), [displayedKey, lang]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="grid gap-12 xl:grid-cols-[200px_1fr]">
      <aside className="hidden xl:block">
        <nav className="sticky top-24 flex flex-col gap-2 text-sm font-light">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-ink)]/45">
            On this page
          </p>
          {NAV_SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-[var(--color-ink)]/60 transition-colors hover:text-[var(--color-ink)]"
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col gap-10">
        <p className="text-xs leading-relaxed text-[var(--color-ink)]/50">
          The public <code>/v1</code> endpoints are not live yet. The shapes
          below are how requests will look when they ship.
        </p>

        <section id="concepts" className="scroll-mt-24">
          <Card>
            <SectionHeader kicker="Concepts" title="How the agent sees" />
            <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-[var(--color-ink)]/70">
              <p>
                The Photo API is the agent&apos;s retina. You hand it a frame
                — a screenshot, a scan, a phone photo — and it returns the
                visual context the loop needs to act: the readable text, a
                rough UI tree, the regions that look interactive. Pixels go
                in, structure comes out.
              </p>
              <p>
                Everything downstream of that, the planning, the tool calls,
                the memory writes, runs locally inside the agent. The API is
                deliberately small. It is the eye, not the brain.
              </p>
            </div>
          </Card>
        </section>

        <section id="quickstart" className="scroll-mt-24">
          <Card>
            <SectionHeader kicker="Quickstart" title="Give the agent a frame" />
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              Send an image, get structured visual context back. Authenticate
              with a bearer token from the keys page.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {(["curl", "js", "python"] as Lang[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLang(item)}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                    lang === item
                      ? "bg-[var(--color-ink)] text-[var(--color-canvas)]"
                      : "border border-[var(--color-ink)]/20 text-[var(--color-ink)]/65 hover:border-[var(--color-ink)]"
                  }`}
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                onClick={copyCode}
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-[var(--color-ink)]/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--color-ink)]/65 transition hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="mt-6">
              <CodeBlock>{code}</CodeBlock>
            </div>

            <div className="mt-8 rounded-2xl border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-ink)]/55">
                {loading
                  ? "Checking your keys"
                  : activeKey
                  ? "Active key"
                  : "No active key"}
              </p>
              {loading ? (
                <p className="mt-2 text-sm text-[var(--color-ink)]/55">
                  Loading…
                </p>
              ) : activeKey ? (
                <>
                  <p className="mt-2 font-mono text-sm">{activeKey.prefix}</p>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink)]/55">
                    The snippet above uses your key&apos;s prefix as a
                    placeholder. Swap it for the full secret you saved when
                    the key was generated.
                  </p>
                </>
              ) : (
                <div className="mt-3">
                  <EmptyState
                    title="Generate a key first"
                    action={
                      <Link
                        href="/dashboard/keys"
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm text-[var(--color-canvas)] transition-opacity hover:opacity-90"
                      >
                        Open API keys
                      </Link>
                    }
                  >
                    You need at least one active key before you can call the
                    API.
                  </EmptyState>
                </div>
              )}
            </div>
          </Card>
        </section>

        <section id="endpoints" className="scroll-mt-24">
          <Card>
            <SectionHeader
              kicker="Endpoints"
              title="The two endpoints that ship first"
            />
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              The agent uses{" "}
              <code className="text-[var(--color-ink)]">/read</code> for fresh
              perception and{" "}
              <code className="text-[var(--color-ink)]">/diff</code> to notice
              what just changed. Both accept either an{" "}
              <code className="text-[var(--color-ink)]">image_url</code> or a
              base64{" "}
              <code className="text-[var(--color-ink)]">image_b64</code>{" "}
              payload.
            </p>

            <div className="mt-8 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-xl font-extralight tracking-[-0.02em]">
                    POST /v1/vision/read
                  </h3>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink)]/50">
                    Shipping next
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ink)]/65">
                  Read a single frame. Returns the visible text, a rough UI
                  tree, and a list of interactive regions with bounding boxes.
                </p>
                <CodeBlock>{READ_REQUEST}</CodeBlock>
                <CodeBlock>{READ_RESPONSE}</CodeBlock>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-xl font-extralight tracking-[-0.02em]">
                    POST /v1/vision/diff
                  </h3>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink)]/50">
                    Shipping next
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ink)]/65">
                  Compare two frames. Returns a short natural-language
                  summary and the regions that appeared, disappeared, or
                  changed.
                </p>
                <CodeBlock>{DIFF_REQUEST}</CodeBlock>
                <CodeBlock>{DIFF_RESPONSE}</CodeBlock>
              </div>
            </div>
          </Card>
        </section>

        <section id="memory" className="scroll-mt-24">
          <Card>
            <SectionHeader kicker="Memory" title="Cortical layers" />
            <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-[var(--color-ink)]/70">
              <p>
                The agent does not stuff every past frame into context. It
                files them. Five layers, roughly from working memory down to
                long-term storage, each loaded only when it earns its place
                in the prompt.
              </p>
            </div>

            <div className="mt-6">
              <Table
                headers={["Layer", "Role"]}
                rows={[
                  ["L0", "Core rules. Always loaded; the agent's reflexes."],
                  ["L1", "Fast index. Skill lookup against a tiny vector store."],
                  ["L2", "Durable facts. Paths, credentials, environment shape."],
                  ["L3", "Task playbooks. The SOPs the agent wrote for itself."],
                  ["L4", "Archived sessions. Cold storage; recalled on demand."],
                ]}
              />
            </div>

            <p className="mt-6 text-sm leading-relaxed text-[var(--color-ink)]/65">
              This is the trick behind a small context window staying sharp.
              The agent remembers in layers so it does not have to remember
              everything at once.
            </p>
          </Card>
        </section>

        <section id="errors" className="scroll-mt-24">
          <Card>
            <SectionHeader kicker="Errors" title="When the eye blinks" />
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              Every error response carries a stable{" "}
              <code className="text-[var(--color-ink)]">code</code> field.
              Match on the code, not the message.
            </p>
            <div className="mt-6">
              <Table
                headers={["Status", "Code", "Meaning", "What to do"]}
                rows={[
                  [
                    "401",
                    <code key="c1">invalid_key</code>,
                    "Key missing, malformed, or revoked.",
                    "Regenerate a key on the keys page and update your client.",
                  ],
                  [
                    "402",
                    <code key="c2">trial_expired</code>,
                    "Free trial window has closed.",
                    "Pay $15 in billing to unlock 30 more days.",
                  ],
                  [
                    "404",
                    <code key="c3">image_unreachable</code>,
                    "We could not fetch the image_url.",
                    "Check the URL is public and returns a 200 within 5s.",
                  ],
                  [
                    "413",
                    <code key="c4">image_too_large</code>,
                    "Payload over the size cap.",
                    "Resize below 4096px on the long side, under 8 MB.",
                  ],
                  [
                    "429",
                    <code key="c5">rate_limited</code>,
                    "Too many requests in a short window.",
                    "Back off and retry; the response includes Retry-After.",
                  ],
                  [
                    "500",
                    <code key="c6">internal</code>,
                    "Something on our side went wrong.",
                    "Retry once; if it persists, ping us with the request id.",
                  ],
                ]}
              />
            </div>
          </Card>
        </section>

        <section id="limits" className="scroll-mt-24">
          <Card>
            <SectionHeader kicker="Limits" title="Boundaries" />
            <ul className="mt-6 flex flex-col gap-3 text-sm leading-relaxed text-[var(--color-ink)]/70">
              <li className="flex items-baseline gap-3">
                <span className="text-[var(--color-ink)]/40">·</span>
                <span>Max image side: 4096 px.</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="text-[var(--color-ink)]/40">·</span>
                <span>Max payload: 8 MB per request.</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="text-[var(--color-ink)]/40">·</span>
                <span>Free trial: 24 hours, 200 frames.</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="text-[var(--color-ink)]/40">·</span>
                <span>
                  Paid: $15/mo, fair-use soft cap. We will write before we
                  throttle.
                </span>
              </li>
            </ul>
          </Card>
        </section>

        <section id="changelog" className="scroll-mt-24">
          <Card>
            <SectionHeader kicker="Changelog" title="What changed" />
            <ol className="mt-6 flex flex-col gap-6 text-sm leading-relaxed text-[var(--color-ink)]/70">
              <li>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-ink)]/55">
                  0.1.0 — first dashboard ships
                </p>
                <p className="mt-2">
                  Account, keys, billing, docs. The shape of the product is in
                  place; the API itself is next.
                </p>
              </li>
              <li>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-ink)]/55">
                  0.0 — closed alpha
                </p>
                <p className="mt-2">
                  Quiet trials with a handful of operators. The agent watched,
                  learned, and started writing its own SOPs.
                </p>
              </li>
            </ol>
          </Card>
        </section>
      </div>
    </div>
  );
}
