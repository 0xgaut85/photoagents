"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, LogOut } from "lucide-react";
import { useDashboardAuth } from "../../_components/DashboardAuth";
import { Badge, Button, Card, Table } from "../../_components/ui";
import { fetchMe, type Me } from "../../_lib/api";

export default function AccountPage() {
  const { label, wallet, logout, linkGoogle, linkWallet, apiFetch } = useDashboardAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMe(apiFetch).then(setMe).catch(() => undefined);
  }, [apiFetch]);

  const email = me?.email ?? (label.includes("@") ? label : null);
  const walletAddress = me?.wallet_address ?? wallet ?? null;

  const copyWallet = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const rows: [string, React.ReactNode, React.ReactNode][] = [];
  if (email) {
    rows.push(["Email", email, <Badge key="e" tone="success">Linked</Badge>]);
  }
  if (walletAddress) {
    rows.push([
      "Wallet",
      <span key="w" className="inline-flex items-center gap-2 font-mono text-xs">
        {`${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`}
        <button
          onClick={copyWallet}
          aria-label="Copy wallet"
          className="text-[var(--color-ink)]/55 hover:text-[var(--color-ink)]"
        >
          {copied ? "Copied" : <Copy size={13} />}
        </button>
      </span>,
      <Badge key="ws" tone="success">Linked</Badge>,
    ]);
  }
  if (rows.length === 0) {
    rows.push(["Privy", "No linked identities yet", <Badge key="p">Waiting</Badge>]);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="flex flex-col justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
            Account
          </p>
          <h2 className="mt-4 break-all text-4xl font-extralight tracking-[-0.05em] md:text-5xl">
            {label}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-[var(--color-ink)]/65">
            Your Privy identity can hold Google, email, and wallet credentials
            under one user. Link whatever you want this dashboard to recognize.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <Button variant="secondary" onClick={linkGoogle}>
            <Link2 size={16} /> Link Google
          </Button>
          <Button variant="secondary" onClick={() => linkWallet()}>
            <Link2 size={16} /> Link wallet
          </Button>
          <Button variant="danger" onClick={logout}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-ink)]/55">
            Linked identities
          </p>
          <h3 className="mt-2 text-3xl font-extralight tracking-[-0.04em]">
            Ways this dashboard knows you
          </h3>
        </div>
        <Table headers={["Type", "Identifier", "Status"]} rows={rows} />

        {me ? (
          <div className="mt-8 grid gap-3 text-sm text-[var(--color-ink)]/65 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-ink)]/55">
                Member since
              </p>
              <p className="mt-2 text-[var(--color-ink)]">
                {new Date(me.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/30 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-ink)]/55">
                Plan
              </p>
              <p className="mt-2 text-[var(--color-ink)] capitalize">
                {me.plan_status}
              </p>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
