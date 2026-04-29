"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Button, Card, Input } from "../../_components/ui";
import { mockKeys } from "../../_lib/mock";

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
  const [lang, setLang] = useState<Lang>("curl");
  const [imageUrl, setImageUrl] = useState("https://example.com/agent-screen.png");
  const [response, setResponse] = useState("");
  const key = mockKeys.find((item) => item.status === "active")?.prefix ?? "pk_live_••••demo";

  const code = useMemo(() => snippets[lang](key), [key, lang]);

  const runMock = () => {
    setResponse(
      JSON.stringify(
        {
          image_url: imageUrl,
          observed: true,
          summary: "A clean dashboard with API usage, keys, and billing controls.",
          objects: ["sidebar", "usage chart", "api key table"],
          confidence: 0.982,
        },
        null,
        2,
      ),
    );
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
          Quickstart
        </p>
        <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
          Give the agent a frame.
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
          The API receives an image and returns structured visual context. These
          examples are pre-filled with your first active key.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {(["curl", "js", "python"] as Lang[]).map((item) => (
            <Button
              key={item}
              variant={lang === item ? "primary" : "secondary"}
              onClick={() => setLang(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        <pre className="mt-6 overflow-x-auto rounded-[1.5rem] bg-[var(--color-ink)] p-5 text-sm leading-relaxed text-[var(--color-canvas)]">
          <code>{code}</code>
        </pre>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
          Playground
        </p>
        <h2 className="mt-4 text-4xl font-extralight tracking-[-0.05em]">
          Try it without an API.
        </h2>
        <label className="mt-8 block text-sm text-[var(--color-muted)]">
          Image URL
          <Input
            className="mt-2"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
          />
        </label>
        <Button className="mt-4 w-full" onClick={runMock}>
          <Play size={16} /> Send mock request
        </Button>

        <pre className="mt-6 min-h-72 overflow-x-auto rounded-[1.5rem] border border-[var(--color-line)] bg-white/70 p-5 text-sm leading-relaxed">
          <code>
            {response ||
              `{
  "status": "waiting",
  "message": "Send a mock request to preview the response."
}`}
          </code>
        </pre>
      </Card>
    </div>
  );
}
