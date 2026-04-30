import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  type HelioWebhookEvent,
  extractExternalPaymentId,
  verifyHelioWebhook,
} from "@/lib/helio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const auth = req.headers.get("authorization");
  const signature = req.headers.get("x-signature");

  if (!verifyHelioWebhook(raw, auth, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: HelioWebhookEvent;
  try {
    event = JSON.parse(raw) as HelioWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const externalId = extractExternalPaymentId(event);
  if (!externalId) {
    // Not one of ours - ack so Helio stops retrying.
    return NextResponse.json({ ok: true, ignored: "no externalPaymentId" });
  }

  const eventType = (event.event ?? "").toUpperCase();
  const txStatus = (event.transactionObject?.meta?.transactionStatus ?? "").toUpperCase();
  const txHash = event.transactionObject?.meta?.transactionSignature ?? null;
  const amountUsdcRaw =
    event.transactionObject?.meta?.totalAmount ??
    event.transactionObject?.meta?.amount ??
    null;
  // Helio reports USDC in base units (6 decimals) on most paylinks.
  const amountUsdc =
    amountUsdcRaw && /^\d+$/.test(amountUsdcRaw)
      ? (Number(amountUsdcRaw) / 1_000_000).toFixed(6)
      : amountUsdcRaw;

  const isSuccess =
    (eventType === "CREATED" || eventType === "TRANSACTION_CREATED") &&
    txStatus === "SUCCESS";
  const isFailure = txStatus === "FAILED" || txStatus === "REJECTED";

  if (isSuccess) {
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
  } else if (isFailure) {
    await query(
      `UPDATE payments SET status = 'failed' WHERE provider_charge_id = $1`,
      [externalId],
    );
  }

  return NextResponse.json({ ok: true });
}
