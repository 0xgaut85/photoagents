"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, RefreshCcw } from "lucide-react";
import { Badge, Button, Card, Table } from "../../_components/ui";
import { mockInvoices, plan } from "../../_lib/mock";
import { useDashboardAuth } from "../../_components/DashboardAuth";
import {
  fetchInvoices,
  fetchMe,
  startCheckout,
  type Me,
} from "../../_lib/api";
import {
  PLAN_PRICE_USD,
  buildOnrampUrl,
  getUsdcBalanceOnBase,
} from "@/lib/coinbase-onramp";

type Invoice = (typeof mockInvoices)[number];

function formatRenews(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return `${date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })} (${days}d left)`;
}

export default function BillingPage() {
  const { apiFetch, mockMode, wallet } = useDashboardAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(mockMode ? mockInvoices : []);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(!mockMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    if (mockMode) return;
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, mockMode, wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePayWithWallet = async () => {
    if (mockMode) {
      setNotice("Coming soon");
      setTimeout(() => setNotice(""), 1800);
      return;
    }
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

  return (
    <div className="flex flex-col gap-8">
      <Card className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
            Billing
          </p>
          <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
            The $15/mo eyes plan.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
            One month at a time. Pay with USDC on Base — or top up first with Apple
            Pay / card via Coinbase Onramp, then come back and pay.
          </p>
          {!mockMode ? (
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <span className="text-[var(--color-muted)]">
                Status:{" "}
                <Badge tone={planStatus === "paid" ? "success" : "warning"}>{planStatus}</Badge>
              </span>
              <span className="text-[var(--color-muted)]">
                Renews: <span className="text-[var(--color-ink)]">{formatRenews(renews)}</span>
              </span>
              <span className="text-[var(--color-muted)]">
                USDC on Base:{" "}
                <span className="text-[var(--color-ink)]">
                  {balance === null ? "…" : `${balance.toFixed(2)} USDC`}
                </span>
              </span>
            </div>
          ) : null}
        </div>
        <div className="rounded-[1.75rem] border border-[var(--color-line)] bg-white/70 p-6">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-ink)] text-[var(--color-canvas)]">
            <CreditCard size={22} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-[var(--color-muted)]">{plan.name}</p>
          <p className="mt-2 text-6xl font-extralight tracking-[-0.07em]">
            {plan.price}
          </p>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            {plan.limit.toLocaleString()} requests included for 30 days.
          </p>

          {mockMode ? (
            <Button className="mt-8 w-full" onClick={handlePayWithWallet}>
              Manage payment
            </Button>
          ) : hasBalance ? (
            <Button className="mt-8 w-full" onClick={handlePayWithWallet} disabled={busy}>
              {busy ? "Opening…" : `Pay $${PLAN_PRICE_USD} with wallet`}
              <ExternalLink size={16} />
            </Button>
          ) : (
            <div className="mt-8 flex flex-col gap-2">
              <Button onClick={handleTopUp} disabled={!wallet && !me?.wallet_address}>
                Top up with Apple Pay or card (${PLAN_PRICE_USD})
                <ExternalLink size={16} />
              </Button>
              <Button variant="ghost" onClick={refresh}>
                <RefreshCcw size={14} /> I&apos;ve topped up — recheck balance
              </Button>
            </div>
          )}

          {notice ? (
            <p className="mt-3 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
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
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
              Invoices
            </p>
            <h3 className="mt-2 text-3xl font-extralight tracking-[-0.04em]">
              Paper trail
            </h3>
          </div>
          {!mockMode ? (
            <Button variant="ghost" onClick={refresh} disabled={loading}>
              <RefreshCcw size={14} /> Refresh
            </Button>
          ) : null}
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">Loading…</p>
        ) : invoices.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">
            No payments yet. Your first one will appear here once confirmed on-chain.
          </p>
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
