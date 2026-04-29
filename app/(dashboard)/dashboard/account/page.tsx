"use client";

import { Copy, Link2, LogOut } from "lucide-react";
import { useDashboardAuth } from "../../_components/DashboardAuth";
import { Badge, Button, Card, Table } from "../../_components/ui";

export default function AccountPage() {
  const { label, wallet, logout, linkGoogle, linkWallet } = useDashboardAuth();
  const rows = [
    label.includes("@") ? ["Email", label, "Primary"] : null,
    wallet ? ["Wallet", `${wallet.slice(0, 6)}…${wallet.slice(-4)}`, "Linked"] : null,
  ].filter(Boolean) as string[][];

  const copyWallet = async () => {
    if (wallet) await navigator.clipboard.writeText(wallet);
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="flex flex-col justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
            Account
          </p>
          <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
            {label}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)]">
            Your Privy identity can hold Google, email, and wallet credentials
            under one user. Link whatever you want your API console to recognize.
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
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Linked identities
          </p>
          <h3 className="mt-2 text-3xl font-extralight tracking-[-0.04em]">
            Ways this dashboard knows you
          </h3>
        </div>
        <Table
          headers={["Type", "Identifier", "Status"]}
          rows={
            rows.length
              ? rows.map((row) => [
                  row[0],
                  <span key={row[1]} className="inline-flex items-center gap-2">
                    {row[1]}
                    {row[0] === "Wallet" ? (
                      <button onClick={copyWallet} aria-label="Copy wallet">
                        <Copy size={14} />
                      </button>
                    ) : null}
                  </span>,
                  <Badge key={row[2]} tone="success">
                    {row[2]}
                  </Badge>,
                ])
              : [["Privy", "No linked identities yet", <Badge key="empty">Waiting</Badge>]]
          }
        />
      </Card>
    </div>
  );
}
