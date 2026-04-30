import { createHmac, timingSafeEqual } from "node:crypto";

export const PLAN_PRICE_USD = 15;

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
