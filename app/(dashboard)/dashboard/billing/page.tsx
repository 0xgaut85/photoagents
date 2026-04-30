"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

const PLAN_PRICE_USD = 15;

function formatRenews(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return `${date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })} (${days}d left)`;
}

export default function BillingPage() {
  const { apiFetch } = useDashboardAuth();
  const search = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (search.get("checkout") === "done") {
      setNotice("Payment received by Helio. USDC arrives in ~1-3 minutes.");
    }
  }, [search]);

  const handlePay = async () => {
    setBusy(true);
    setError(null);
    try {
      const { hosted_url } = await startCheckout(apiFetch);
      window.open(hosted_url, "_blank", "noopener,noreferrer");
      setNotice("Helio opened in a new tab. Refresh after paying.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  const planStatus = me?.plan_status ?? "free";
  const renews = me?.plan_renews_at ?? null;

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
            Pay with Apple Pay, credit card, or your own crypto. Helio handles
            the checkout on their hosted page; you get 30 days of agent vision
            once the USDC settles on Base. No card on file, no recurring charge.
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

          <Button className="mt-8 w-full" onClick={handlePay} disabled={busy}>
            {busy ? "Opening…" : `Pay $${PLAN_PRICE_USD}`}
            <ExternalLink size={16} />
          </Button>
          <p className="mt-3 text-center text-[11px] uppercase tracking-[0.22em] text-[var(--color-ink)]/45">
            Apple Pay · Card · Crypto
          </p>

          {notice ? (
            <p className="mt-4 text-center text-xs text-[var(--color-ink)]/65">
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
            Your first invoice appears here once Helio confirms the USDC has
            landed on Base. Usually 1-3 minutes.
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
