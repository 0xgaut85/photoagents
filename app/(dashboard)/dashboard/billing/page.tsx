"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, RefreshCcw } from "lucide-react";
import { Badge, Button, Card, EmptyState, Table } from "../../_components/ui";
import { useDashboardAuth } from "../../_components/DashboardAuth";
import {
  fetchInvoices,
  fetchMe,
  startCheckout,
  type Invoice,
  type Me,
} from "../../_lib/api";
import {
  PLAN_PRICE_USD,
  buildOnrampUrl,
  getUsdcBalanceOnBase,
} from "@/lib/coinbase-onramp";

function formatRenews(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return `${date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })} (${days}d left)`;
}

export default function BillingPage() {
  const { apiFetch, wallet } = useDashboardAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [user, list] = await Promise.all([
        fetchMe(apiFetch),
        fetchInvoices(apiFetch),
      ]);
      setMe(user);
      setInvoices(list);
      const checkAddress = user.wallet_address ?? wallet ?? null;
      if (checkAddress) {
        getUsdcBalanceOnBase(checkAddress).then(setBalance).catch(() => setBalance(0));
      } else {
        setBalance(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePayWithWallet = async () => {
    setBusy(true);
    setError(null);
    try {
      const { hosted_url } = await startCheckout(apiFetch);
      window.open(hosted_url, "_blank", "noopener,noreferrer");
      setNotice("Charge opened in a new tab. Refresh after paying.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  const handleTopUp = () => {
    const address = me?.wallet_address ?? wallet;
    if (!address) {
      setError("Connect a wallet first.");
      return;
    }
    const url = buildOnrampUrl({ walletAddress: address, amountUsd: PLAN_PRICE_USD });
    window.open(url, "_blank", "noopener,noreferrer");
    setNotice("Onramp opened. After USDC arrives on Base, click ‘Pay $15 with wallet’.");
  };

  const planStatus = me?.plan_status ?? "free";
  const renews = me?.plan_renews_at ?? null;
  const hasBalance = (balance ?? 0) >= PLAN_PRICE_USD;
  const hasWallet = !!(me?.wallet_address ?? wallet);

  return (
    <div className="flex flex-col gap-8">
      <Card className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
            Billing
          </p>
          <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
            $15 / month.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/65">
            Pay one month at a time in USDC on Base. No card on file, no
            recurring charge. If you don&apos;t have USDC yet, top up with Apple
            Pay or card via Coinbase Onramp first.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <span className="text-[var(--color-ink)]/55">
              Status:{" "}
              <Badge tone={planStatus === "paid" ? "success" : "warning"}>{planStatus}</Badge>
            </span>
            <span className="text-[var(--color-ink)]/55">
              Renews:{" "}
              <span className="text-[var(--color-ink)]">{formatRenews(renews)}</span>
            </span>
            <span className="text-[var(--color-ink)]/55">
              USDC on Base:{" "}
              <span className="text-[var(--color-ink)]">
                {balance === null ? (hasWallet ? "…" : "no wallet") : `${balance.toFixed(2)} USDC`}
              </span>
            </span>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--color-ink)]/15 bg-[var(--color-paper)]/30 p-6">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-ink)] text-[var(--color-canvas)]">
            <CreditCard size={22} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-[var(--color-ink)]/55">Photo API</p>
          <p className="mt-2 text-6xl font-extralight tracking-[-0.07em]">
            ${PLAN_PRICE_USD}
            <span className="text-2xl text-[var(--color-ink)]/55">/mo</span>
          </p>
          <p className="mt-3 text-sm text-[var(--color-ink)]/55">
            30 days of agent vision per charge.
          </p>

          {!hasWallet ? (
            <p className="mt-6 rounded-2xl border border-[var(--color-ink)]/15 bg-[var(--color-canvas)] px-4 py-3 text-xs text-[var(--color-ink)]/65">
              Link a wallet on the Account page to pay or top up.
            </p>
          ) : hasBalance ? (
            <Button className="mt-8 w-full" onClick={handlePayWithWallet} disabled={busy}>
              {busy ? "Opening…" : `Pay $${PLAN_PRICE_USD} with wallet`}
              <ExternalLink size={16} />
            </Button>
          ) : (
            <div className="mt-8 flex flex-col gap-2">
              <Button onClick={handleTopUp}>
                Top up with Apple Pay or card
                <ExternalLink size={16} />
              </Button>
              <Button variant="ghost" onClick={refresh}>
                <RefreshCcw size={14} /> I&apos;ve topped up — recheck balance
              </Button>
            </div>
          )}

          {notice ? (
            <p className="mt-3 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-ink)]/55">
              {notice}
            </p>
          ) : null}
        </div>
      </Card>

      {error ? (
        <Card className="border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>
      ) : null}

      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-ink)]/55">
              Invoices
            </p>
            <h3 className="mt-2 text-3xl font-extralight tracking-[-0.04em]">
              Paper trail
            </h3>
          </div>
          <Button variant="ghost" onClick={refresh} disabled={loading}>
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--color-ink)]/55">Loading…</p>
        ) : invoices.length === 0 ? (
          <EmptyState title="No payments yet">
            Your first invoice appears here once a Coinbase Commerce charge
            confirms on-chain.
          </EmptyState>
        ) : (
          <Table
            headers={["Invoice", "Date", "Amount", "Status"]}
            rows={invoices.map((invoice) => [
              invoice.id,
              invoice.date,
              invoice.amount,
              <Badge key={invoice.id} tone={invoice.status === "paid" ? "success" : "warning"}>
                {invoice.status}
              </Badge>,
            ])}
          />
        )}
      </Card>
    </div>
  );
}
