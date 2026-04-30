import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { PLAN_PRICE_USD, createCharge } from "@/lib/helio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const externalPaymentId = randomUUID();

    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    const redirectUrl = `${origin}/dashboard/billing?checkout=done`;

    const charge = await createCharge({
      externalPaymentId,
      email: user.email,
      redirectUrl,
    });

    await query(
      `INSERT INTO payments (user_id, provider, provider_charge_id, amount_usd, status)
         VALUES ($1, 'helio', $2, $3, 'pending')
       ON CONFLICT (provider_charge_id) DO NOTHING`,
      [user.id, externalPaymentId, PLAN_PRICE_USD],
    );

    return NextResponse.json({
      hosted_url: charge.pageUrl,
      charge_id: externalPaymentId,
      helio_charge_id: charge.id,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("/api/billing/checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
