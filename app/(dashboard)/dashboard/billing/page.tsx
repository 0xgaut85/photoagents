"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Script from "next/script";
import { CreditCard, RefreshCcw } from "lucide-react";
import { Badge, Button, Card, EmptyState, Table } from "../../_components/ui";
import { useDashboardAuth } from "../../_components/DashboardAuth";
import {
  createPaymentIntent,
  fetchInvoices,
  fetchMe,
  syncPayments,
  type Invoice,
  type Me,
} from "../../_lib/api";

const PLAN_PRICE_USD = 15;
const PAYLINK_ID = process.env.NEXT_PUBLIC_HELIO_PAYLINK_ID ?? "";

declare global {
  interface Window {
    helioCheckout?: (
      container: HTMLElement,
      config: HelioConfig,
    ) => void;
  }
}

type HelioConfig = {
  paylinkId: string;
  theme?: { themeMode?: "light" | "dark" };
  primaryColor?: string;
  neutralColor?: string;
  display?: "inline" | "modal";
  // Helio expects a plain object here (their docs example is `additionalJSON: { ... }`).
  // Passing a stringified JSON causes Helio to silently drop it and store null
  // on the transaction, breaking webhook + REST matching.
  additionalJSON?: Record<string, unknown>;
  customerDetails?: { email?: string };
  onSuccess?: (event: unknown) => void;
  onError?: (event: unknown) => void;
  onPending?: (event: unknown) => void;
  onCancel?: () => void;
  onStartPayment?: () => void;
};

function formatRenews(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return `${date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })} (${days}d left)`;
}

export default function BillingPage() {
  const { apiFetch, mockMode } = useDashboardAuth();
  const containerId = useId().replace(/:/g, "_");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  const [me, setMe] = useState<Me | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

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

  // Pull confirmed transactions from Helio's API and reconcile against our
  // local payments table. This is the primary path; the webhook is backup.
  const sync = useCallback(
    async (silent = false) => {
      if (mockMode) return;
      if (!silent) setSyncing(true);
      try {
        const result = await syncPayments(apiFetch);
        if (result.matched > 0) {
          setNotice(
            result.matched === 1
              ? "Payment confirmed. Plan extended."
              : `${result.matched} payments confirmed. Plan extended.`,
          );
          await refresh();
        } else if (!silent) {
          setNotice("No new confirmed payments yet. Try again in a moment.");
        }
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : "Could not sync with Helio");
        }
      } finally {
        if (!silent) setSyncing(false);
      }
    },
    [apiFetch, mockMode, refresh],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-sync on mount: catches the case where the user paid in a previous
  // session, closed the tab before onSuccess fired, and is now coming back.
  // Silent so it doesn't show an error toast if Helio is briefly unreachable.
  useEffect(() => {
    if (mockMode) return;
    void sync(true);
  }, [mockMode, sync]);

  // Mount the Helio embed widget once the script + container are both ready.
  useEffect(() => {
    if (mockMode) return;
    if (!scriptReady) return;
    if (!containerRef.current) return;
    if (initializedRef.current) return;
    if (!PAYLINK_ID) {
      setIntentError("NEXT_PUBLIC_HELIO_PAYLINK_ID is not set");
      return;
    }
    if (typeof window.helioCheckout !== "function") return;

    let cancelled = false;

    (async () => {
      try {
        const intent = await createPaymentIntent(apiFetch);
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;

        window.helioCheckout!(container, {
          paylinkId: PAYLINK_ID,
          theme: { themeMode: "light" },
          primaryColor: "#141714",
          neutralColor: "#BEBDBB",
          display: "inline",
          additionalJSON: {
            externalPaymentId: intent.external_payment_id,
          },
          ...(intent.email ? { customerDetails: { email: intent.email } } : {}),
          onStartPayment: () => setNotice("Payment started…"),
          onPending: () => setNotice("Payment pending — waiting for confirmation."),
          onSuccess: () => {
            setNotice("Payment confirmed. Reconciling with Helio…");
            // Helio's onSuccess fires before their backend has finished
            // settling. Wait a beat, then pull the authoritative state.
            setTimeout(() => {
              void sync();
            }, 2000);
          },
          onError: (event) => {
            console.error("Helio onError", event);
            setNotice("Payment failed. You can try again.");
          },
          onCancel: () => setNotice("Payment cancelled."),
        });

        initializedRef.current = true;
        setWidgetReady(true);
      } catch (err) {
        if (cancelled) return;
        setIntentError(err instanceof Error ? err.message : "Could not start checkout");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiFetch, mockMode, refresh, scriptReady, sync]);

  const planStatus = me?.plan_status ?? "trial";
  const renews = me?.plan_renews_at ?? null;

  return (
    <div className="flex flex-col gap-8">
      {!mockMode ? (
        <Script
          src="https://embed.hel.io/assets/index-v1.js"
          type="module"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
          onLoad={() => setScriptReady(true)}
        />
      ) : null}

      <Card className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
            Billing
          </p>
          <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
            $15 / month.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/65">
            Pay with Apple Pay, credit card, or your own crypto. Helio handles
            the checkout inline below; you get 30 days of agent vision once the
            payment settles. No card on file, no recurring charge.
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
          <div className="mt-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-ink)] text-[var(--color-canvas)]">
              <CreditCard size={18} strokeWidth={1.5} />
            </div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-ink)]/45">
              Apple Pay · Card · Crypto
            </p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--color-ink)]/15 bg-[var(--color-paper)]/30 p-4 sm:p-6">
          {mockMode ? (
            <div className="flex h-[420px] flex-col items-center justify-center text-center text-sm text-[var(--color-ink)]/55">
              <p>Checkout disabled in mock mode.</p>
              <p className="mt-2 text-xs">
                Set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> +{" "}
                <code>NEXT_PUBLIC_HELIO_PAYLINK_ID</code> to enable Helio.
              </p>
            </div>
          ) : intentError ? (
            <div className="flex h-[420px] flex-col items-center justify-center text-center text-sm text-red-700">
              <p>{intentError}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div
                ref={containerRef}
                id={`helio-${containerId}`}
                className="flex min-h-[420px] w-full justify-center [&>*]:mx-auto"
              />
              {!widgetReady ? (
                <p className="mt-3 text-center text-xs text-[var(--color-ink)]/45">
                  Loading checkout…
                </p>
              ) : null}
              {notice ? (
                <p className="mt-3 text-center text-xs text-[var(--color-ink)]/65">
                  {notice}
                </p>
              ) : null}
            </div>
          )}
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
          <div className="flex gap-2">
            {!mockMode ? (
              <Button variant="ghost" onClick={() => sync(false)} disabled={syncing}>
                <RefreshCcw size={14} /> {syncing ? "Syncing…" : "Sync from Helio"}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={refresh} disabled={loading}>
              <RefreshCcw size={14} /> Refresh
            </Button>
          </div>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--color-ink)]/55">Loading…</p>
        ) : invoices.length === 0 ? (
          <EmptyState title="No payments yet">
            Your first invoice appears here once Helio confirms the payment.
            Usually 1-3 minutes.
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
