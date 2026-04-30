import { createHmac, timingSafeEqual } from "node:crypto";

export const PLAN_PRICE_USD = 15;

const API_BASE = "https://api.hel.io";

export type HelioCharge = {
  id: string;
  paymentLinkId: string;
  pageUrl: string;
};

export type HelioWebhookEvent = {
  event?: string;
  transaction?: string;
  transactionObject?: {
    id?: string;
    paylinkId?: string;
    quantity?: number;
    fee?: number;
    createdAt?: string;
    meta?: {
      id?: string;
      transactionStatus?: string;
      transactionType?: string;
      transactionSignature?: string;
      amount?: string;
      senderPK?: string;
      recipientPK?: string;
      currency?: { id?: string };
      productValue?: string;
      totalAmount?: string;
      customerDetails?: Record<string, unknown>;
    };
    additionalJSON?: string | null;
  };
  // Helio sometimes nests the externalPaymentId at top level too.
  additionalJSON?: string | null;
};

function publicKey(): string {
  const key = process.env.HELIO_PUBLIC_KEY;
  if (!key) throw new Error("HELIO_PUBLIC_KEY is not set");
  return key;
}

function secretKey(): string {
  const key = process.env.HELIO_SECRET_KEY;
  if (!key) throw new Error("HELIO_SECRET_KEY is not set");
  return key;
}

function paylinkId(): string {
  const id = process.env.HELIO_PAYLINK_ID;
  if (!id) throw new Error("HELIO_PAYLINK_ID is not set");
  return id;
}

/**
 * Create a one-off Helio charge (a hosted checkout URL) tied to a fixed paylink.
 * The buyer can pay with card, Apple Pay, Google Pay, or crypto; the merchant
 * receives USDC (configured on the paylink itself).
 *
 * We attach `additionalJSON.externalPaymentId` so the webhook can match the
 * payment back to our DB row.
 *
 * Docs: https://docs.hel.io/api-integration/charge-api
 */
export async function createCharge(input: {
  externalPaymentId: string;
  email?: string | null;
  redirectUrl?: string;
}): Promise<HelioCharge> {
  const url = `${API_BASE}/v1/charge/api-key?apiKey=${encodeURIComponent(publicKey())}`;
  const body = {
    paymentRequestId: paylinkId(),
    prepareRequestBody: {
      ...(input.email ? { customerDetails: { email: input.email } } : {}),
      additionalJSON: JSON.stringify({
        externalPaymentId: input.externalPaymentId,
      }),
      ...(input.redirectUrl ? { redirectUrl: input.redirectUrl } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Helio createCharge failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    id?: string;
    paylinkId?: string;
    pageUrl?: string;
    url?: string;
  };
  const id = data.id ?? "";
  const pageUrl = data.pageUrl ?? data.url ?? "";
  if (!id || !pageUrl) {
    throw new Error("Helio createCharge: missing id or pageUrl in response");
  }
  return { id, paymentLinkId: data.paylinkId ?? paylinkId(), pageUrl };
}

/**
 * Verify an inbound Helio webhook.
 *
 * Helio sends:
 *   - `Authorization: Bearer <sharedToken>` — shared secret you set when
 *     registering the webhook. Must match HELIO_WEBHOOK_SHARED_TOKEN.
 *   - `X-Signature: <hex>` — HMAC-SHA256 of the raw request body, keyed by
 *     the same shared token.
 *
 * Both must match; the bearer alone is not enough.
 */
export function verifyHelioWebhook(
  rawBody: string,
  authHeader: string | null,
  signatureHeader: string | null,
): boolean {
  const sharedToken = process.env.HELIO_WEBHOOK_SHARED_TOKEN;
  if (!sharedToken) return false;
  if (!authHeader || !signatureHeader) return false;

  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (bearer !== sharedToken) return false;

  const expected = createHmac("sha256", sharedToken).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signatureHeader.trim(), "hex");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Parse `additionalJSON` (which Helio echoes back as a string) and pull out
 * our externalPaymentId. Returns null if not present.
 */
export function extractExternalPaymentId(event: HelioWebhookEvent): string | null {
  const raw = event.transactionObject?.additionalJSON ?? event.additionalJSON ?? null;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { externalPaymentId?: unknown };
    if (typeof parsed.externalPaymentId === "string") return parsed.externalPaymentId;
    return null;
  } catch {
    return null;
  }
}
