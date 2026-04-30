"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, KeyRound, Sparkles, Wallet } from "lucide-react";
import { useDashboardAuth } from "../_components/DashboardAuth";
import { Card, EmptyState } from "../_components/ui";
import { fetchKeys, fetchMe, type ApiKey, type Me, type PlanStatus } from "../_lib/api";

function formatRenews(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return {
    date: date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }),
    days,
  };
}

function formatTrialRemaining(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 1) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function planLabel(status: PlanStatus): string {
  if (status === "paid") return "$15/mo";
  if (status === "trial") return "Trial";
  return "Expired";
}

export default function DashboardPage() {
  const { label, apiFetch } = useDashboardAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchMe(apiFetch).catch(() => null),
      fetchKeys(apiFetch).catch(() => [] as ApiKey[]),
    ]).then(([user, list]) => {
      if (cancelled) return;
      setMe(user);
      setKeys(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  const planStatus: PlanStatus = me?.plan_status ?? "trial";
  const renews = formatRenews(me?.plan_renews_at ?? null);
  const trialRemaining = formatTrialRemaining(me?.trial_ends_at ?? null);
  const activeKeys = keys.filter((k) => k.status === "active").length;

  return (
    <div className="flex flex-col gap-8">
      {!loading && planStatus === "trial" ? (
        <Card className="flex flex-col gap-4 border-amber-300/60 bg-amber-50/80 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">
              Free 24-hour trial
            </p>
            <p className="mt-2 text-base font-light text-amber-900">
              {trialRemaining
                ? `${trialRemaining} in your trial. Pay $15 to keep going for 30 more days.`
                : "Your trial is ending soon. Pay $15 to keep going for 30 days."}
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm text-[var(--color-canvas)] transition-opacity hover:opacity-90 md:self-auto"
          >
            Pay $15 <ArrowRight size={15} />
          </Link>
        </Card>
      ) : null}

      {!loading && planStatus === "expired" ? (
        <Card className="flex flex-col gap-4 border-red-300/60 bg-red-50/80 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-red-700">
              Trial expired
            </p>
            <p className="mt-2 text-base font-light text-red-900">
              Your 24-hour trial is over. Pay $15 to unlock 30 days of agent vision.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm text-[var(--color-canvas)] transition-opacity hover:opacity-90 md:self-auto"
          >
            Pay $15 <ArrowRight size={15} />
          </Link>
        </Card>
      ) : null}

      {!loading && planStatus === "paid" && renews ? (
        <Card className="flex flex-col gap-4 border-emerald-300/60 bg-emerald-50/80 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">
              Plan active
            </p>
            <p className="mt-2 text-base font-light text-emerald-900">
              Renews on {renews.date} ({renews.days} days left).
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-700 px-5 py-2.5 text-sm text-emerald-900 transition-colors hover:bg-emerald-100 md:self-auto"
          >
            Renew early
          </Link>
        </Card>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="flex min-h-72 flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
              Welcome
            </p>
            <h2 className="mt-4 max-w-3xl text-5xl font-extralight tracking-[-0.06em] md:text-6xl">
              {label}
            </h2>
            <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-[var(--color-ink)]/65">
              Create a key, send an image, watch the agent see. Three doors:
              keys, billing, docs.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/keys"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm text-[var(--color-canvas)] transition-opacity hover:opacity-90"
            >
              <KeyRound size={15} /> New API key
            </Link>
            <Link
              href="/dashboard/docs"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ink)]/20 px-5 py-3 text-sm transition-colors hover:border-[var(--color-ink)]"
            >
              <Sparkles size={15} /> Read the docs
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
              At a glance
            </p>
            <dl className="mt-6 flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4 border-b border-[var(--color-ink)]/10 pb-4">
                <dt className="text-sm text-[var(--color-ink)]/65">Active keys</dt>
                <dd className="text-3xl font-extralight tracking-[-0.04em]">
                  {loading ? "—" : activeKeys}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-4 border-b border-[var(--color-ink)]/10 pb-4">
                <dt className="text-sm text-[var(--color-ink)]/65">Plan</dt>
                <dd className="text-3xl font-extralight tracking-[-0.04em]">
                  {loading ? "—" : planLabel(planStatus)}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-4">
                <dt className="text-sm text-[var(--color-ink)]/65">Wallet</dt>
                <dd className="inline-flex items-center gap-2 text-sm font-light">
                  <Wallet size={14} strokeWidth={1.5} />
                  {me?.wallet_address
                    ? `${me.wallet_address.slice(0, 6)}…${me.wallet_address.slice(-4)}`
                    : "Not linked"}
                </dd>
              </div>
            </dl>
          </div>
        </Card>
      </section>

      <Card>
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-ink)]/55">
          Usage
        </p>
        <h3 className="mt-2 text-3xl font-extralight tracking-[-0.04em]">
          Metering arrives with the API
        </h3>
        <div className="mt-6">
          <EmptyState title="Nothing to chart yet">
            Per-request metering will land alongside the public <code>/v1</code>
            endpoints. For now, your dashboard is wired up and waiting.
          </EmptyState>
        </div>
      </Card>
    </div>
  );
}
