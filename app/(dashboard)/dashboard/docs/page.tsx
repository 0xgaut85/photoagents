"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { Button, Card, EmptyState } from "../../_components/ui";
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
    <div className="grid gap-8 xl:grid-cols-[1fr_0.85fr]">
      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
          Quickstart
        </p>
        <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
          Give the agent a frame.
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/65">
          The API receives an image and returns structured visual context.
          Authenticate with a bearer token from the keys page.
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

        <pre className="mt-6 overflow-x-auto rounded-[1.5rem] bg-[var(--color-ink)] p-5 text-sm leading-relaxed text-[var(--color-canvas)]">
          <code>{code}</code>
        </pre>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
          Your keys
        </p>
        <h2 className="mt-4 text-3xl font-extralight tracking-[-0.04em]">
          {loading ? "Loading…" : activeKey ? "Authenticated and ready" : "No active key"}
        </h2>

        {loading ? (
          <p className="mt-6 text-sm text-[var(--color-ink)]/55">Checking your keys…</p>
        ) : activeKey ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-[var(--color-ink)]/65">
              The snippets above use your active key prefix as a placeholder.
              Replace it with the full secret you saved when you generated the key.
            </p>
            <div className="rounded-2xl border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-ink)]/55">
                Active key
              </p>
              <p className="mt-2 font-mono text-sm">{activeKey.prefix}</p>
            </div>
          </div>
        ) : (
          <div className="mt-6">
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
              You need at least one active key before you can call the API.
            </EmptyState>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-ink)]/15 bg-[var(--color-paper)]/30 p-4 text-xs leading-relaxed text-[var(--color-ink)]/55">
          The public <code>/v1</code> endpoints are not live yet. The shapes
          above are how requests will look when they ship.
        </div>
      </Card>
    </div>
  );
}
