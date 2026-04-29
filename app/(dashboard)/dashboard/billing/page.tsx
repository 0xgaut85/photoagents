"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Badge, Button, Card, Table } from "../../_components/ui";
import { mockInvoices, plan } from "../../_lib/mock";

export default function BillingPage() {
  const [notice, setNotice] = useState("");

  const comingSoon = () => {
    setNotice("Coming soon");
    setTimeout(() => setNotice(""), 1800);
  };

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
            This is the public promise from Quick Start translated into a dashboard:
            a starter API plan for agents that need to understand images.
          </p>
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
            {plan.limit.toLocaleString()} requests included each month.
          </p>
          <Button className="mt-8 w-full" onClick={comingSoon}>
            Manage payment
          </Button>
          {notice ? (
            <p className="mt-3 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {notice}
            </p>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Invoices
          </p>
          <h3 className="mt-2 text-3xl font-extralight tracking-[-0.04em]">
            Paper trail
          </h3>
        </div>
        <Table
          headers={["Invoice", "Date", "Amount", "Status"]}
          rows={mockInvoices.map((invoice) => [
            invoice.id,
            invoice.date,
            invoice.amount,
            <Badge key={invoice.id} tone={invoice.status === "paid" ? "success" : "warning"}>
              {invoice.status}
            </Badge>,
          ])}
        />
      </Card>
    </div>
  );
}
