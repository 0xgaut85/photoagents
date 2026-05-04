/**
 * Thin wrapper around Helio's REST API. Used by /api/billing/sync to pull
 * confirmed transactions for our paylink and reconcile them against the
 * local `payments` table. This is the primary path; the webhook is kept as
 * a backup but Helio's webhook delivery has proven unreliable in practice.
 *
 * Auth scheme (per https://docs.hel.io/llms.txt):
 *   - publicKey  -> query string `?publicKey=...`
 *   - secretKey  -> `Authorization: Bearer ...`
 */

const HELIO_API_BASE = "https://api.hel.io/v1";

export type HelioTransaction = {
  /** Helio's internal transaction id (Mongo ObjectId). */
  id: string;
  paylinkId: string;
  createdAt: string;
  /** SUCCESS | PENDING | FAILED | REJECTED. We only care about SUCCESS. */
  transactionStatus: string;
  /** Solana tx signature, present for confirmed on-chain payments. */
  transactionSignature: string | null;
  /** Total paid in base units of the token (e.g. USDC base units = 6 dp). */
  totalAmountRaw: string | null;
  /** Echoed back from `additionalJSON.externalPaymentId` we set at intent. */
  externalPaymentId: string | null;
  /** Buyer email, if Helio collected it at checkout. */
  customerEmail: string | null;
};

type RawHelioTransaction = {
  id?: string;
  paylinkId?: string;
  createdAt?: string;
  additionalJSON?: string | null;
  meta?: {
    transactionStatus?: string;
    transactionSignature?: string;
    totalAmount?: string;
    amount?: string;
    customerDetails?: { email?: string } & Record<string, unknown>;
    additionalJSON?: string | null;
  };
};

/**
 * Fetch SUCCESS+other transactions for a paylink. Caller filters by status.
 *
 * @param paylinkId - Helio paylink id (env: NEXT_PUBLIC_HELIO_PAYLINK_ID).
 * @param sinceMs   - Lower bound for `createdAt` filter, ms since epoch.
 *                    Pass null to fetch all (Helio caps server-side).
 */
export async function fetchPaylinkTransactions(
  paylinkId: string,
  sinceMs: number | null = null,
): Promise<HelioTransaction[]> {
  const publicKey = process.env.HELIO_PUBLIC_KEY;
  const secretKey = process.env.HELIO_SECRET_KEY;
  if (!publicKey || !secretKey) {
    throw new Error("HELIO_PUBLIC_KEY and HELIO_SECRET_KEY must be set");
  }

  const url = new URL(`${HELIO_API_BASE}/paylink/${paylinkId}/transactions`);
  url.searchParams.set("publicKey", publicKey);
  if (sinceMs) {
    url.searchParams.set("from", new Date(sinceMs).toISOString());
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      authorization: `Bearer ${secretKey}`,
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Helio API ${res.status}: ${body.slice(0, 300)}`);
  }

  const raw = (await res.json()) as RawHelioTransaction[] | { data?: RawHelioTransaction[] };
  const list = Array.isArray(raw) ? raw : (raw.data ?? []);
  return list.map(normalize);
}

function normalize(tx: RawHelioTransaction): HelioTransaction {
  // Helio has historically nested additionalJSON either at top level or under
  // meta. Check both. Also tolerate it being already-parsed JSON.
  const rawJson = tx.additionalJSON ?? tx.meta?.additionalJSON ?? null;
  let externalPaymentId: string | null = null;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as { externalPaymentId?: unknown };
      if (typeof parsed.externalPaymentId === "string") {
        externalPaymentId = parsed.externalPaymentId;
      }
    } catch {
      // not JSON, leave as null
    }
  }

  const totalAmountRaw =
    tx.meta?.totalAmount ?? tx.meta?.amount ?? null;

  const email =
    typeof tx.meta?.customerDetails?.email === "string"
      ? tx.meta.customerDetails.email
      : null;

  return {
    id: tx.id ?? "",
    paylinkId: tx.paylinkId ?? "",
    createdAt: tx.createdAt ?? new Date().toISOString(),
    transactionStatus: (tx.meta?.transactionStatus ?? "").toUpperCase(),
    transactionSignature: tx.meta?.transactionSignature ?? null,
    totalAmountRaw,
    externalPaymentId,
    customerEmail: email,
  };
}

/**
 * USDC has 6 decimals on Solana. Helio reports `totalAmount` in base units.
 * Convert "15000000" -> "15.000000".
 */
export function usdcRawToDecimal(raw: string | null): string | null {
  if (!raw || !/^\d+$/.test(raw)) return raw;
  return (Number(raw) / 1_000_000).toFixed(6);
}
