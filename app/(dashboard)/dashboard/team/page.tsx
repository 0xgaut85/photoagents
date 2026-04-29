"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Badge, Button, Card, Input, Table } from "../../_components/ui";
import { type TeamMember, mockTeam } from "../../_lib/mock";

function isWallet(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(mockTeam);
  const [invite, setInvite] = useState("");

  const addInvite = () => {
    const trimmed = invite.trim();
    if (!trimmed) return;
    setMembers((current) => [
      {
        id: crypto.randomUUID(),
        name: "Invited user",
        identifier: isWallet(trimmed)
          ? `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`
          : trimmed,
        role: "Viewer",
        joined: "Pending",
      },
      ...current,
    ]);
    setInvite("");
  };

  return (
    <div className="flex flex-col gap-8">
      <Card className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
            Team
          </p>
          <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
            Share the console.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
            Invite collaborators by email or wallet address. The v1 front-end
            keeps invites in local state until the backend exists.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-[var(--color-line)] bg-white/70 p-5">
          <label className="text-sm text-[var(--color-muted)]">
            Email or wallet
            <Input
              className="mt-2"
              value={invite}
              onChange={(event) => setInvite(event.target.value)}
              placeholder="ops@company.com or 0x..."
            />
          </label>
          <Button className="mt-4 w-full" onClick={addInvite}>
            <UserPlus size={16} /> Invite
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          headers={["Member", "Identifier", "Role", "Joined"]}
          rows={members.map((member) => [
            <span key="name" className="font-normal">
              {member.name}
            </span>,
            member.identifier,
            <Badge key="role" tone={member.role === "Owner" ? "success" : "neutral"}>
              {member.role}
            </Badge>,
            member.joined,
          ])}
        />
      </Card>
    </div>
  );
}
