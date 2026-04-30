import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { type MoonpayWebhookEvent, verifyMoonpayWebhook } from "@/lib/moonpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("moonpay-signature-v2");

  if (!verifyMoonpayWebhook(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: MoonpayWebhookEvent;
  try {
    event = JSON.parse(raw) as MoonpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tx = event.data;
  const externalId = tx.externalTransactionId;
  if (!externalId) {
    // Not one of ours - ack so MoonPay stops retrying.
    return NextResponse.json({ ok: true, ignored: "no externalTransactionId" });
  }

  const status = (tx.status ?? "").toLowerCase();

  if (status === "completed") {
    const txHash = tx.cryptoTransactionId ?? null;
    const amountUsdc = tx.quoteCurrencyAmount != null ? String(tx.quoteCurrencyAmount) : null;

    const { rows } = await query<{ user_id: string }>(
      `UPDATE payments
          SET status = 'confirmed',
              confirmed_at = now(),
              tx_hash = COALESCE($2, tx_hash),
              amount_usdc = COALESCE($3::numeric, amount_usdc)
        WHERE provider_charge_id = $1
          AND status <> 'confirmed'
        RETURNING user_id`,
      [externalId, txHash, amountUsdc],
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
  } else if (status === "failed") {
    await query(
      `UPDATE payments SET status = 'failed' WHERE provider_charge_id = $1`,
      [externalId],
    );
  } else if (status === "pending" || status === "waitingPayment" || status === "waitingAuthorization") {
    await query(
      `UPDATE payments SET status = 'pending'
        WHERE provider_charge_id = $1 AND status NOT IN ('confirmed','failed')`,
      [externalId],
    );
  }

  return NextResponse.json({ ok: true });
}
