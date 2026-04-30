"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button, Card, EmptyState, Input } from "../../_components/ui";

export default function TeamPage() {
  const [invite, setInvite] = useState("");
  const [notice, setNotice] = useState("");

  const submit = () => {
    if (!invite.trim()) return;
    setNotice("Team invites land in v2. We&apos;ll email you when it ships.");
    setInvite("");
    setTimeout(() => setNotice(""), 3000);
  };

  return (
    <div className="flex flex-col gap-8">
      <Card className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
            Team
          </p>
          <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
            Share the console.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/65">
            For now, every account is single-user. Multi-seat workspaces with
            roles (owner, developer, viewer) ship in the next release. Drop
            your interest below and we&apos;ll let you know when invites open.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-[var(--color-ink)]/15 bg-[var(--color-paper)]/30 p-5">
          <label className="text-sm text-[var(--color-ink)]/65">
            Email or wallet
            <Input
              className="mt-2"
              value={invite}
              onChange={(event) => setInvite(event.target.value)}
              placeholder="ops@company.com or 0x..."
            />
          </label>
          <Button className="mt-4 w-full" onClick={submit}>
            <UserPlus size={16} /> Notify me when ready
          </Button>
          {notice ? (
            <p className="mt-3 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-ink)]/55">
              {notice}
            </p>
          ) : null}
        </div>
      </Card>

      <Card>
        <EmptyState title="No teammates yet">
          You&apos;re the only seat on this account. Invitations will appear
          here once team support is live.
        </EmptyState>
      </Card>
    </div>
  );
}
