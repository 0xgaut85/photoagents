import type { ApiKey, Invoice } from "./mock";

export type Me = {
  id: string;
  privy_id: string;
  email: string | null;
  wallet_address: string | null;
  display_name: string | null;
  plan_status: "free" | "paid";
  plan_renews_at: string | null;
  created_at: string;
  last_seen_at: string;
};

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function fetchMe(apiFetch: Fetcher): Promise<Me> {
  const res = await apiFetch("/api/me");
  const { user } = await readJson<{ user: Me }>(res);
  return user;
}

export async function fetchKeys(apiFetch: Fetcher): Promise<ApiKey[]> {
  const res = await apiFetch("/api/keys");
  const { keys } = await readJson<{ keys: ServerKey[] }>(res);
  return keys.map(toApiKey);
}

export async function createKey(
  apiFetch: Fetcher,
  name: string,
): Promise<{ key: ApiKey; secret: string }> {
  const res = await apiFetch("/api/keys", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const { key, secret } = await readJson<{ key: ServerKey; secret: string }>(res);
  return { key: toApiKey(key), secret };
}

export async function revokeKey(apiFetch: Fetcher, id: string): Promise<ApiKey> {
  const res = await apiFetch(`/api/keys/${id}`, { method: "DELETE" });
  const { key } = await readJson<{ key: ServerKey }>(res);
  return toApiKey(key);
}

export async function startCheckout(
  apiFetch: Fetcher,
): Promise<{ hosted_url: string; charge_id: string }> {
  const res = await apiFetch("/api/billing/checkout", { method: "POST" });
  return readJson<{ hosted_url: string; charge_id: string }>(res);
}

export async function fetchInvoices(apiFetch: Fetcher): Promise<Invoice[]> {
  const res = await apiFetch("/api/billing/invoices");
  const { payments } = await readJson<{ payments: ServerPayment[] }>(res);
  return payments.map(toInvoice);
}

type ServerKey = {
  id: string;
  name: string;
  prefix: string;
  status: "active" | "revoked";
  created_at: string;
  last_used_at: string | null;
};

type ServerPayment = {
  id: string;
  amount_usd: string;
  status: "pending" | "confirmed" | "failed" | "expired";
  created_at: string;
  confirmed_at: string | null;
};

function toApiKey(row: ServerKey): ApiKey {
  return {
    id: row.id,
    name: row.name,
    prefix: `${row.prefix}••••${row.id.slice(-4)}`,
    createdAt: formatDate(row.created_at),
    lastUsed: row.last_used_at ? formatRelative(row.last_used_at) : "Never",
    status: row.status,
  };
}

function toInvoice(row: ServerPayment): Invoice {
  return {
    id: `INV-${row.id.slice(0, 8).toUpperCase()}`,
    date: formatDate(row.confirmed_at ?? row.created_at),
    amount: `$${Number(row.amount_usd).toFixed(2)}`,
    status: row.status === "confirmed" ? "paid" : "open",
  };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}
