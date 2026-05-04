import { NextResponse } from "next/server";
import { AuthError, effectivePlanStatus, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { PLAN_PRICE_USD } from "@/lib/helio";
import { fetchPaylinkTransactions, usdcRawToDecimal } from "@/lib/helio-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reconcile this user's pending payments against Helio's authoritative
 * transaction list. This is the primary confirmation path; the webhook at
 * /api/billing/webhook/helio is kept as a backup but is unreliable in
 * practice (Helio's webhook delivery has been flaky).
 *
 * Matching strategy (in order):
 *   1. PRIMARY:  meta.additionalJSON.externalPaymentId === payments.provider_charge_id
 *   2. FALLBACK: customerDetails.email === user.email AND
 *                amount matches PLAN_PRICE_USD AND
 *                transaction is from the last 24h AND
 *                user has at least one pending row in that window
 *
 * The endpoint is idempotent: re-running on an already-confirmed payment is
 * a no-op (the WHERE status <> 'confirmed' clause in the UPDATE handles it).
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);

    const paylinkId = process.env.NEXT_PUBLIC_HELIO_PAYLINK_ID;
    if (!paylinkId) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_HELIO_PAYLINK_ID not set" },
        { status: 500 },
      );
    }

    // Pull this user's pending payments from the last 24h.
    const pending = await query<{ provider_charge_id: string }>(
      `SELECT provider_charge_id
         FROM payments
        WHERE user_id = $1
          AND status = 'pending'
          AND created_at > now() - interval '24 hours'`,
      [user.id],
    );
    const pendingIds = new Set(pending.rows.map((r) => r.provider_charge_id));

    // Pull the last 24h of transactions from Helio. Smaller responses, lower
    // chance of pagination edge cases as history grows.
    const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
    const transactions = await fetchPaylinkTransactions(paylinkId, sinceMs);
    const successful = transactions.filter((t) => t.transactionStatus === "SUCCESS");

    let matched = 0;
    const matchedSignatures = new Set<string>();

    // ---- PRIMARY PASS: externalPaymentId match ----
    for (const tx of successful) {
      if (!tx.externalPaymentId) continue;
      if (!pendingIds.has(tx.externalPaymentId)) continue;
      const did = await confirmPayment({
        externalPaymentId: tx.externalPaymentId,
        txSignature: tx.transactionSignature,
        amountUsdc: usdcRawToDecimal(tx.totalAmountRaw),
        userId: user.id,
      });
      if (did) {
        matched += 1;
        if (tx.transactionSignature) matchedSignatures.add(tx.transactionSignature);
        pendingIds.delete(tx.externalPaymentId);
      }
    }

    // ---- FALLBACK PASS: email + amount + time ----
    // Only runs if the primary pass left pending rows AND we have an email
    // on file for this user. We pick the OLDEST pending row per Helio tx so
    // the matching is deterministic if there are multiple pending intents.
    if (pendingIds.size > 0 && user.email) {
      const userEmail = user.email.trim().toLowerCase();
      for (const tx of successful) {
        if (pendingIds.size === 0) break;
        if (tx.transactionSignature && matchedSignatures.has(tx.transactionSignature)) {
          continue; // already matched in primary pass
        }
        if (!tx.customerEmail) continue;
        if (tx.customerEmail.trim().toLowerCase() !== userEmail) continue;

        const amountDecimal = usdcRawToDecimal(tx.totalAmountRaw);
        if (amountDecimal && Number(amountDecimal) + 0.01 < PLAN_PRICE_USD) continue;

        const oldestPending = await query<{ provider_charge_id: string }>(
          `SELECT provider_charge_id
             FROM payments
            WHERE user_id = $1
              AND status = 'pending'
              AND created_at > now() - interval '24 hours'
            ORDER BY created_at ASC
            LIMIT 1`,
          [user.id],
        );
        const target = oldestPending.rows[0]?.provider_charge_id;
        if (!target) break;

        const did = await confirmPayment({
          externalPaymentId: target,
          txSignature: tx.transactionSignature,
          amountUsdc: amountDecimal,
          userId: user.id,
        });
        if (did) {
          matched += 1;
          if (tx.transactionSignature) matchedSignatures.add(tx.transactionSignature);
          pendingIds.delete(target);
        }
      }
    }

    // Re-read user to return current plan state to the client.
    const { rows } = await query<{
      plan_status: string;
      plan_renews_at: string | null;
      trial_ends_at: string | null;
    }>(
      `SELECT plan_status, plan_renews_at, trial_ends_at FROM users WHERE id = $1`,
      [user.id],
    );
    const fresh = rows[0];
    const status = fresh
      ? effectivePlanStatus({
          plan_renews_at: fresh.plan_renews_at,
          trial_ends_at: fresh.trial_ends_at,
        })
      : "trial";

    return NextResponse.json({
      matched,
      plan: {
        status,
        renews_at: fresh?.plan_renews_at ?? null,
        trial_ends_at: fresh?.trial_ends_at ?? null,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("/api/billing/sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

/**
 * Atomic confirm: flip the payment to confirmed AND extend the user's plan.
 * Returns true if the payment row was actually flipped (i.e. wasn't already
 * confirmed by an earlier sync or by the webhook).
 */
async function confirmPayment(args: {
  externalPaymentId: string;
  txSignature: string | null;
  amountUsdc: string | null;
  userId: string;
}): Promise<boolean> {
  const updated = await query<{ user_id: string }>(
    `UPDATE payments
        SET status = 'confirmed',
            confirmed_at = now(),
            tx_hash = COALESCE($2, tx_hash),
            amount_usdc = COALESCE($3::numeric, amount_usdc)
      WHERE provider_charge_id = $1
        AND user_id = $4
        AND status <> 'confirmed'
      RETURNING user_id`,
    [args.externalPaymentId, args.txSignature, args.amountUsdc, args.userId],
  );
  if (updated.rows.length === 0) return false;

  await query(
    `UPDATE users
        SET plan_status = 'paid',
            plan_renews_at = GREATEST(COALESCE(plan_renews_at, now()), now()) + interval '30 days'
      WHERE id = $1`,
    [args.userId],
  );
  return true;
}
