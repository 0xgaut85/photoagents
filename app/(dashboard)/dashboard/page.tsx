"use client";

import { useDashboardAuth } from "../_components/DashboardAuth";
import UsageChart from "../_components/UsageChart";
import { Card, Stat, Table } from "../_components/ui";
import { mockEndpointUsage, mockKeys, mockUsageSeries, plan } from "../_lib/mock";

export default function DashboardPage() {
  const { label } = useDashboardAuth();
  const lastSeven = mockUsageSeries.slice(-7);
  const totalRequests = mockUsageSeries.reduce((sum, item) => sum + item.requests, 0);
  const activeKeys = mockKeys.filter((key) => key.status === "active").length;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="min-h-72">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
            Welcome
          </p>
          <h2 className="mt-4 max-w-3xl text-5xl font-extralight tracking-[-0.06em] md:text-6xl">
            {label} is ready to give your agent vision.
          </h2>
          <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-[var(--color-muted)]">
            Create a key, send an image, watch the system learn from every
            observation. The backend is mocked for now, but the front-end flow is
            complete.
          </p>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
              This month
            </p>
            <p className="mt-4 text-6xl font-extralight tracking-[-0.07em]">
              {Math.round((plan.used / plan.limit) * 100)}%
            </p>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              {plan.used.toLocaleString()} of {plan.limit.toLocaleString()} requests used.
            </p>
          </div>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-[var(--color-line)]">
            <div
              className="h-full rounded-full bg-[var(--color-ink)]"
              style={{ width: `${(plan.used / plan.limit) * 100}%` }}
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="Requests" value={totalRequests.toLocaleString()} detail="30-day mock volume" />
        <Stat label="Active keys" value={String(activeKeys)} detail="Production + local" />
        <Stat label="Plan" value={plan.price} detail="Photo API starter" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Last 7 days
              </p>
              <h3 className="mt-2 text-3xl font-extralight tracking-[-0.04em]">
                Usage is compounding
              </h3>
            </div>
          </div>
          <UsageChart data={lastSeven} compact />
        </Card>

        <Card>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
              Recent activity
            </p>
            <h3 className="mt-2 text-3xl font-extralight tracking-[-0.04em]">
              Endpoint pulse
            </h3>
          </div>
          <Table
            headers={["Endpoint", "Requests", "Success"]}
            rows={mockEndpointUsage.slice(0, 3).map((item) => [
              item.endpoint,
              item.requests.toLocaleString(),
              item.success,
            ])}
          />
        </Card>
      </section>
    </div>
  );
}
