import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { type WebhookEvent, verifyWebhook } from "@/lib/coinbase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-cc-webhook-signature");

  if (!verifyWebhook(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: { event?: WebhookEvent };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  if (!event) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }

  const charge = event.data;
  const chargeId = charge.id;
  const amountUsd = Number(charge.pricing?.local?.amount ?? 0);

  switch (event.type) {
    case "charge:confirmed": {
      const txHash = charge.payments?.find((p) => p.transaction_id)?.transaction_id ?? null;
      const amountUsdc = charge.payments?.find((p) => p.value?.crypto?.amount)?.value?.crypto?.amount ?? null;

      const { rows } = await query<{ user_id: string }>(
        `UPDATE payments
            SET status = 'confirmed',
                confirmed_at = now(),
                tx_hash = COALESCE($2, tx_hash),
                amount_usdc = COALESCE($3::numeric, amount_usdc)
          WHERE provider_charge_id = $1
            AND status <> 'confirmed'
          RETURNING user_id`,
        [chargeId, txHash, amountUsdc],
      );

      const userId = rows[0]?.user_id;
      if (userId) {
        await query(
          `UPDATE users
              SET plan_status = 'paid',
                  plan_renews_at = GREATEST(COALESCE(plan_renews_at, now()), now()) + interval '30 days'
            WHERE id = $1`,
          [userId],
        );
      }
      break;
    }
    case "charge:failed":
      await query(
        `UPDATE payments SET status = 'failed' WHERE provider_charge_id = $1`,
        [chargeId],
      );
      break;
    case "charge:delayed":
    case "charge:pending":
      await query(
        `UPDATE payments SET status = 'pending' WHERE provider_charge_id = $1 AND status NOT IN ('confirmed','failed')`,
        [chargeId],
      );
      break;
    case "charge:resolved":
      break;
    default:
      break;
  }

  // Coinbase wants any 2xx for ack.
  return NextResponse.json({ ok: true, amount_usd: amountUsd });
}
