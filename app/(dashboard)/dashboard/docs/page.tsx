"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { Button, Card, EmptyState, Table } from "../../_components/ui";
import { useDashboardAuth } from "../../_components/DashboardAuth";
import { fetchKeys, type ApiKey } from "../../_lib/api";

const NAV_SECTIONS: { id: string; label: string }[] = [
  { id: "install", label: "Install" },
  { id: "key", label: "API key" },
  { id: "llm", label: "LLM credentials" },
  { id: "run", label: "Run the agent" },
  { id: "clients", label: "GUI clients" },
  { id: "validate", label: "Validate endpoint" },
  { id: "state", label: "On-disk state" },
  { id: "errors", label: "Errors" },
  { id: "limits", label: "Limits" },
];

const installSnippets = {
  pip: `pip install photoagents
# or, with every optional client + integration
pip install "photoagents[all]"`,
  source: `git clone https://github.com/jmerelnyc/Photo-agents.git
cd Photo-agents
pip install -e .`,
};

type InstallTab = keyof typeof installSnippets;

const keySnippets = {
  env: (key: string) => `# Linux / macOS
export PHOTOAGENTS_API_KEY=${key}

# Windows (PowerShell)
$env:PHOTOAGENTS_API_KEY = "${key}"`,
  config: (key: string) => `# ~/.photoagents/config.json
{
  "api_key": "${key}"
}`,
  prompt: () => `# First run prompts you for the key and offers to save it.
$ python -m photoagents

A Photo Agents API key is required.
Sign in and copy yours from https://photo-agents.com/dashboard/keys

Photo Agents API key: ********
Save this key for future runs? [Y/n]`,
};

type KeyTab = keyof typeof keySnippets;

const RUN_SNIPPETS = `# Interactive REPL
python -m photoagents

# One-shot task
python -m photoagents --task my_task --input "List the largest files in this directory."

# Watchdog / scheduler mode
python -m photoagents --reflect photoagents/evolution/scheduler.py`;

const VALIDATE_REQUEST = `POST /v1/keys/validate
Content-Type: application/json

{
  "api_key": "pk_live_...",
  "client_version": "0.1.0"
}`;

const VALIDATE_RESPONSE_OK = `200 OK

{
  "valid": true,
  "tier": "pro",
  "expires_at": "2026-06-03T11:12:47.052Z"
}`;

const VALIDATE_RESPONSE_FAIL = `200 OK   # we always return 200 with valid=false on rejection

{
  "valid": false,
  "reason": "trial_or_subscription_expired"
}`;

const LLM_CONFIG = `# from the repo root
cp photoagents/config/keys_template.py credentials.py

# then edit credentials.py and uncomment ONE provider block:
#
#   ANTHROPIC_API_KEY = "sk-ant-..."
#   OPENAI_API_KEY    = "sk-..."
#
# A JSON form is also accepted (credentials.json with the same field names).`;

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

function TabBar<T extends string>({
  tabs,
  active,
  onSelect,
  onCopy,
  copied,
}: {
  tabs: readonly T[];
  active: T;
  onSelect: (tab: T) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onSelect(tab)}
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
            active === tab
              ? "bg-[var(--color-ink)] text-[var(--color-canvas)]"
              : "border border-[var(--color-ink)]/20 text-[var(--color-ink)]/65 hover:border-[var(--color-ink)]"
          }`}
        >
          {tab}
        </button>
      ))}
      <button
        type="button"
        onClick={onCopy}
        className="ml-auto inline-flex items-center gap-2 rounded-full border border-[var(--color-ink)]/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--color-ink)]/65 transition hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function DocsPage() {
  const { apiFetch } = useDashboardAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [installTab, setInstallTab] = useState<InstallTab>("pip");
  const [keyTab, setKeyTab] = useState<KeyTab>("env");
  const [copiedField, setCopiedField] = useState<string>("");

  useEffect(() => {
    fetchKeys(apiFetch)
      .then((list) => setKeys(list))
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const activeKey = keys.find((k) => k.status === "active");
  const placeholderKey = "pk_live_YOUR_KEY";
  const displayedKey = activeKey?.prefix.replace(/[•]/g, "x") ?? placeholderKey;

  const installCode = useMemo(() => installSnippets[installTab], [installTab]);
  const keyCode = useMemo(() => {
    const fn = keySnippets[keyTab];
    return typeof fn === "function" && fn.length === 1 ? fn(displayedKey) : (fn as () => string)();
  }, [keyTab, displayedKey]);

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(""), 1400);
  };

  return (
    <div className="-mx-5 grid w-[calc(100%+2.5rem)] gap-10 md:-mx-8 md:w-[calc(100%+4rem)] md:gap-12 xl:grid-cols-[220px_minmax(0,1fr)] xl:px-0">
      <aside className="hidden xl:block xl:pl-8">
        <nav className="sticky top-28 flex flex-col gap-2 text-sm font-light">
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
          <a
            href="https://github.com/jmerelnyc/Photo-agents"
            target="_blank"
            rel="noreferrer"
            className="mt-6 text-xs uppercase tracking-[0.22em] text-[var(--color-ink)]/55 hover:text-[var(--color-ink)]"
          >
            GitHub repo →
          </a>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col gap-10 px-5 md:px-8 xl:pr-8">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
            Photo Agents
          </p>
          <h1 className="mt-3 text-4xl font-extralight tracking-[-0.05em] md:text-5xl">
            Run an autonomous, self-evolving photo agent on your machine.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[var(--color-ink)]/70">
            <code>photoagents</code> is a single Python package that bundles the
            agent loop, a multi-provider LLM router, a physical execution
            toolset (file I/O, sandboxed code execution, browser automation
            via CDP), a layered memory system, and ready-to-run web /
            desktop / chat clients. The runtime is gated by your Photo Agents
            API key, validated against{" "}
            <code>https://photo-agents.com/v1/keys/validate</code> on every
            cold start (and cached for 24h thereafter).
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://github.com/jmerelnyc/Photo-agents"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-[var(--color-canvas)] transition-opacity hover:opacity-90"
            >
              GitHub repo
            </a>
            <Link
              href="/dashboard/keys"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ink)]/20 px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-[var(--color-ink)] transition hover:border-[var(--color-ink)]"
            >
              API keys →
            </Link>
          </div>
        </Card>

        <section id="install" className="scroll-mt-28">
          <Card>
            <SectionHeader kicker="Install" title="Get the package" />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              Photo Agents needs Python 3.10+. Install from PyPI, or clone the
              GitHub repo if you want to read the source as you go.
            </p>
            <TabBar
              tabs={["pip", "source"] as const}
              active={installTab}
              onSelect={setInstallTab}
              onCopy={() => copy("install", installCode)}
              copied={copiedField === "install"}
            />
            <div className="mt-6">
              <CodeBlock>{installCode}</CodeBlock>
            </div>
          </Card>
        </section>

        <section id="key" className="scroll-mt-28">
          <Card>
            <SectionHeader kicker="API key" title="Hand the runtime your key" />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              The agent looks for your key in three places, in order: the{" "}
              <code>PHOTOAGENTS_API_KEY</code> environment variable, the{" "}
              <code>api_key</code> field in <code>~/.photoagents/config.json</code>,
              then an interactive prompt on first run that offers to persist
              the answer for you.
            </p>
            <TabBar
              tabs={["env", "config", "prompt"] as const}
              active={keyTab}
              onSelect={setKeyTab}
              onCopy={() => copy("key", keyCode)}
              copied={copiedField === "key"}
            />
            <div className="mt-6">
              <CodeBlock>{keyCode}</CodeBlock>
            </div>

            <div className="mt-8 rounded-2xl border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-ink)]/55">
                {loading
                  ? "Checking your keys"
                  : activeKey
                  ? "Your active key"
                  : "No active key"}
              </p>
              {loading ? (
                <p className="mt-2 text-sm text-[var(--color-ink)]/55">Loading…</p>
              ) : activeKey ? (
                <>
                  <p className="mt-2 font-mono text-sm">{activeKey.prefix}</p>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink)]/55">
                    The snippets above use a placeholder. Swap it for the full
                    secret you saved when this key was generated. We only keep
                    a hash, so if you lost it, generate a new key.
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
                    You need at least one active key before the agent will
                    start. Trial includes 24h to try the full surface.
                  </EmptyState>
                </div>
              )}
            </div>
          </Card>
        </section>

        <section id="llm" className="scroll-mt-28">
          <Card>
            <SectionHeader kicker="LLM credentials" title="Plug in a model" />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              Photo Agents ships with a multi-provider router with first-class
              support for Anthropic Claude (native) and OpenAI GPT (native),
              plus a mixin failover session. You bring the model credentials.
            </p>
            <div className="mt-6">
              <CodeBlock>{LLM_CONFIG}</CodeBlock>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" onClick={() => copy("llm", LLM_CONFIG)}>
                {copiedField === "llm" ? <Check size={13} /> : <Copy size={13} />}
                {copiedField === "llm" ? "Copied" : "Copy"}
              </Button>
            </div>
          </Card>
        </section>

        <section id="run" className="scroll-mt-28">
          <Card>
            <SectionHeader kicker="Run" title="Three modes" />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              The runtime exposes a single entry point. Pick interactive,
              one-shot, or watchdog depending on whether the agent should wait
              on you, run a single task, or keep itself busy on a schedule.
            </p>
            <div className="mt-6">
              <CodeBlock>{RUN_SNIPPETS}</CodeBlock>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" onClick={() => copy("run", RUN_SNIPPETS)}>
                {copiedField === "run" ? <Check size={13} /> : <Copy size={13} />}
                {copiedField === "run" ? "Copied" : "Copy"}
              </Button>
            </div>
          </Card>
        </section>

        <section id="clients" className="scroll-mt-28">
          <Card>
            <SectionHeader kicker="GUI clients" title="Or skip the terminal" />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              Several optional frontends ship in the same package. Pick
              whichever fits your workflow. All of them call the same license
              gate before starting any service, so a missing or revoked key
              refuses launch instead of failing later.
            </p>
            <div className="mt-6 overflow-x-auto">
              <Table
                headers={["Client", "Launch command"]}
                rows={[
                  [
                    "Streamlit web app + webview",
                    <code key="cmd-1">pythonw -m photoagents.cli.launcher</code>,
                  ],
                  [
                    "Service hub (start / stop)",
                    <code key="cmd-2">pythonw -m photoagents.cli.hub</code>,
                  ],
                  [
                    "Desktop app (PyQt)",
                    <code key="cmd-3">python -m photoagents.clients.desktop_app</code>,
                  ],
                  [
                    "Desktop companion",
                    <code key="cmd-4">pythonw -m photoagents.clients.companion_v2</code>,
                  ],
                  [
                    "Telegram bot",
                    <code key="cmd-5">python -m photoagents.clients.telegram_client</code>,
                  ],
                  [
                    "Feishu / WeCom / DingTalk / QQ",
                    <code key="cmd-6">{`python -m photoagents.clients.<feishu|wecom|...>_client`}</code>,
                  ],
                ]}
              />
            </div>
          </Card>
        </section>

        <section id="validate" className="scroll-mt-28">
          <Card>
            <SectionHeader
              kicker="Validate endpoint"
              title="POST /v1/keys/validate"
            />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              The Python client hits this endpoint on every cold start and
              caches a successful response for 24h. You can call it directly
              if you want to gate your own service the same way the agent
              gates itself.
            </p>

            <div className="mt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-extralight tracking-[-0.02em]">Request</h3>
                <CodeBlock>{VALIDATE_REQUEST}</CodeBlock>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-extralight tracking-[-0.02em]">
                  Response — accepted
                </h3>
                <p className="text-sm text-[var(--color-ink)]/65">
                  <code>tier</code> is <code>pro</code> for paid users and{" "}
                  <code>trial</code> while the 24h trial is still active.
                  <code> expires_at</code> is the renewal date for paid users
                  and the trial end for trial users.
                </p>
                <CodeBlock>{VALIDATE_RESPONSE_OK}</CodeBlock>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-extralight tracking-[-0.02em]">
                  Response — rejected
                </h3>
                <p className="text-sm text-[var(--color-ink)]/65">
                  Rejections always return HTTP 200 with{" "}
                  <code>valid: false</code> and a stable{" "}
                  <code>reason</code>. Possible reasons:{" "}
                  <code>missing_api_key</code>, <code>unknown_key</code>,{" "}
                  <code>revoked</code>, <code>trial_or_subscription_expired</code>.
                </p>
                <CodeBlock>{VALIDATE_RESPONSE_FAIL}</CodeBlock>
              </div>
            </div>
          </Card>
        </section>

        <section id="state" className="scroll-mt-28">
          <Card>
            <SectionHeader kicker="On-disk state" title="Where things live" />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              The runtime keeps everything under <code>~/.photoagents/</code>.
              Safe to delete if you want a clean slate; the agent will rebuild.
            </p>
            <div className="mt-6 overflow-x-auto">
              <Table
                headers={["Path", "Contents"]}
                rows={[
                  [
                    <code key="p-1">~/.photoagents/config.json</code>,
                    "API key + license validation cache (24h TTL)",
                  ],
                  [
                    <code key="p-2">~/.photoagents/global_mem.txt</code>,
                    "Long-term L2 facts the agent decided to remember",
                  ],
                  [
                    <code key="p-3">~/.photoagents/sessions/</code>,
                    "L4 raw session archives (cold storage, recalled on demand)",
                  ],
                  [
                    <code key="p-4">~/.photoagents/skill_index/</code>,
                    "Vector index for skill / SOP search (L1)",
                  ],
                  [
                    <code key="p-5">~/.photoagents/temp/</code>,
                    "Per-task scratch (logs, intermediate output)",
                  ],
                ]}
              />
            </div>
          </Card>
        </section>

        <section id="errors" className="scroll-mt-28">
          <Card>
            <SectionHeader kicker="Errors" title="License gate failures" />
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[var(--color-ink)]/65">
              Match on the <code>reason</code> field, not the human message.
              Reasons are stable across releases.
            </p>
            <div className="mt-6 overflow-x-auto">
              <Table
                headers={["Reason", "Meaning", "What to do"]}
                rows={[
                  [
                    <code key="e-1">missing_api_key</code>,
                    "Request body did not include an api_key.",
                    "Set PHOTOAGENTS_API_KEY or write it to ~/.photoagents/config.json.",
                  ],
                  [
                    <code key="e-2">unknown_key</code>,
                    "Key is not in our database.",
                    "Generate a fresh one on the API keys page and replace.",
                  ],
                  [
                    <code key="e-3">revoked</code>,
                    "Key was revoked from the dashboard.",
                    "Generate a new one. Old key will not validate again.",
                  ],
                  [
                    <code key="e-4">trial_or_subscription_expired</code>,
                    "24h trial ended, or paid plan lapsed.",
                    "Pay $15 in billing to extend 30 days, then retry.",
                  ],
                ]}
              />
            </div>
          </Card>
        </section>

        <section id="limits" className="scroll-mt-28">
          <Card>
            <SectionHeader kicker="Limits" title="What the plans cover" />
            <ul className="mt-6 flex flex-col gap-3 text-sm leading-relaxed text-[var(--color-ink)]/70">
              <li className="flex items-baseline gap-3">
                <span className="text-[var(--color-ink)]/40">·</span>
                <span>
                  <strong className="font-normal text-[var(--color-ink)]">Trial:</strong>{" "}
                  24 hours from first key generation, full feature surface, no
                  hard request cap.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="text-[var(--color-ink)]/40">·</span>
                <span>
                  <strong className="font-normal text-[var(--color-ink)]">Paid:</strong>{" "}
                  $15 per 30 days. Pay in USDC, card, or Apple Pay via Helio.
                  Fair-use soft cap; we will write before we throttle.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="text-[var(--color-ink)]/40">·</span>
                <span>
                  <strong className="font-normal text-[var(--color-ink)]">License cache:</strong>{" "}
                  successful validation is cached for 24h on disk so the gate
                  stays fast and survives brief network outages.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="text-[var(--color-ink)]/40">·</span>
                <span>
                  <strong className="font-normal text-[var(--color-ink)]">LLM costs:</strong>{" "}
                  you pay your own provider directly. Photo Agents is BYOK for
                  the model layer.
                </span>
              </li>
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}
