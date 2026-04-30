import { createHmac, timingSafeEqual } from "node:crypto";

export const PLAN_PRICE_USD = 15;
const BUY_URL = "https://buy.moonpay.com";

export type MoonpayWebhookEvent = {
  type: string;
  data: {
    id: string;
    status?: string;
    externalTransactionId?: string;
    cryptoTransactionId?: string | null;
    quoteCurrencyAmount?: number | string | null;
    baseCurrencyAmount?: number | string | null;
    walletAddress?: string;
  };
};

function publicKey(): string {
  const key = process.env.MOONPAY_PUBLIC_KEY;
  if (!key) throw new Error("MOONPAY_PUBLIC_KEY is not set");
  return key;
}

function secretKey(): string {
  const key = process.env.MOONPAY_SECRET_KEY;
  if (!key) throw new Error("MOONPAY_SECRET_KEY is not set");
  return key;
}

function receivingWallet(): string {
  const addr = process.env.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS;
  if (!addr) throw new Error("NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS is not set");
  return addr;
}

/**
 * Build a signed MoonPay Buy widget URL that drops the buyer on a hosted page
 * pre-locked to $15 USD -> USDC on Base, sent to the merchant's wallet.
 *
 * Signing is required by MoonPay whenever walletAddress is pre-filled.
 * Algorithm: base64(HMAC-SHA256(secret, "?<queryString>")) appended as &signature=...
 * See https://dev.moonpay.com/docs/ramps-sdk-url-signing
 */
export function buildSignedBuyUrl(input: {
  externalTransactionId: string;
  redirectUrl?: string;
  email?: string | null;
  amountUsd?: number;
}): string {
  const params = new URLSearchParams({
    apiKey: publicKey(),
    currencyCode: "usdc_base",
    walletAddress: receivingWallet(),
    baseCurrencyCode: "usd",
    baseCurrencyAmount: String(input.amountUsd ?? PLAN_PRICE_USD),
    lockAmount: "true",
    paymentMethod: "apple_pay",
    externalTransactionId: input.externalTransactionId,
  });
  if (input.redirectUrl) params.set("redirectURL", input.redirectUrl);
  if (input.email) params.set("email", input.email);

  const query = params.toString();
  const signature = createHmac("sha256", secretKey())
    .update(`?${query}`)
    .digest("base64");

  return `${BUY_URL}?${query}&signature=${encodeURIComponent(signature)}`;
}

/**
 * Verify the Moonpay-Signature-V2 header on incoming webhooks.
 * Header format: "t=<unix>,s=<hex>"
 * Signed payload: `${t}.${rawBody}`
 * Rejects timestamps older than 5 minutes (replay protection).
 */
export function verifyMoonpayWebhook(rawBody: string, header: string | null): boolean {
  if (!header) return false;
  const secret = process.env.MOONPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const parts = header.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const t = parts.t;
  const s = parts.s;
  if (!t || !s) return false;

  const ts = Number(t);
  if (!Number.isFinite(ts)) return false;
  const ageSec = Math.abs(Date.now() / 1000 - ts);
  if (ageSec > 300) return false;

  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(s, "hex");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
