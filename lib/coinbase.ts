import { createHmac, timingSafeEqual } from "node:crypto";

const COMMERCE_API = "https://api.commerce.coinbase.com";
export const PLAN_PRICE_USD = 15;

export type Charge = {
  id: string;
  code: string;
  hosted_url: string;
  pricing: { local: { amount: string; currency: string } };
  metadata?: Record<string, string>;
};

export type WebhookEvent = {
  id: string;
  type: string;
  data: Charge & {
    timeline?: { time: string; status: string; context?: string }[];
    payments?: { value?: { crypto?: { amount: string } }; transaction_id?: string; status?: string }[];
  };
};

function apiKey(): string {
  const key = process.env.COINBASE_COMMERCE_API_KEY;
  if (!key) throw new Error("COINBASE_COMMERCE_API_KEY is not set");
  return key;
}

export async function createCharge(input: {
  userId: string;
  privyId: string;
  amountUsd?: number;
  name?: string;
  description?: string;
}): Promise<Charge> {
  const amount = input.amountUsd ?? PLAN_PRICE_USD;
  const res = await fetch(`${COMMERCE_API}/charges`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-CC-Api-Key": apiKey(),
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify({
      name: input.name ?? "photo agents — 1 month",
      description: input.description ?? "30 days of agent vision",
      pricing_type: "fixed_price",
      local_price: { amount: amount.toFixed(2), currency: "USD" },
      metadata: {
        user_id: input.userId,
        privy_id: input.privyId,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Coinbase Commerce error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { data: Charge };
  return json.data;
}

export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
