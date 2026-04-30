import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { PLAN_PRICE_USD } from "@/lib/helio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mint a fresh externalPaymentId for the Helio embed widget. The browser
 * passes this id back to Helio via `additionalJSON.externalPaymentId`, and
 * the webhook uses it to match the confirmed payment to this DB row.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const externalPaymentId = randomUUID();

    await query(
      `INSERT INTO payments (user_id, provider, provider_charge_id, amount_usd, status)
         VALUES ($1, 'helio', $2, $3, 'pending')
       ON CONFLICT (provider_charge_id) DO NOTHING`,
      [user.id, externalPaymentId, PLAN_PRICE_USD],
    );

    return NextResponse.json({
      external_payment_id: externalPaymentId,
      amount_usd: PLAN_PRICE_USD,
      email: user.email,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("/api/billing/intent error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
