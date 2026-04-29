import UsageChart from "../../_components/UsageChart";
import { Card, Stat, Table } from "../../_components/ui";
import { mockEndpointUsage, mockUsageSeries, plan } from "../../_lib/mock";

export default function UsagePage() {
  const totalRequests = mockUsageSeries.reduce((sum, item) => sum + item.requests, 0);
  const totalImages = mockUsageSeries.reduce((sum, item) => sum + item.images, 0);
  const usagePct = Math.round((plan.used / plan.limit) * 100);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="Requests" value={totalRequests.toLocaleString()} detail="Last 30 days" />
        <Stat label="Images read" value={totalImages.toLocaleString()} detail="Mocked texture volume" />
        <Stat label="Plan limit" value={`${usagePct}%`} detail={`${plan.used.toLocaleString()} / ${plan.limit.toLocaleString()}`} />
      </section>

      <Card>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
              Usage
            </p>
            <h2 className="mt-3 text-5xl font-extralight tracking-[-0.06em]">
              Every request leaves a trail.
            </h2>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-2 flex justify-between text-sm text-[var(--color-muted)]">
              <span>Monthly limit</span>
              <span>{usagePct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-line)]">
              <div className="h-full rounded-full bg-[var(--color-ink)]" style={{ width: `${usagePct}%` }} />
            </div>
          </div>
        </div>
        <UsageChart data={mockUsageSeries} />
      </Card>

      <Card>
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Endpoints
          </p>
          <h3 className="mt-2 text-3xl font-extralight tracking-[-0.04em]">
            Where the agent looks most
          </h3>
        </div>
        <Table
          headers={["Endpoint", "Requests", "Avg latency", "Success"]}
          rows={mockEndpointUsage.map((item) => [
            item.endpoint,
            item.requests.toLocaleString(),
            item.latency,
            item.success,
          ])}
        />
      </Card>
    </div>
  );
}
