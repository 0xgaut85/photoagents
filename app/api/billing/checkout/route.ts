import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { PLAN_PRICE_USD, createCharge } from "@/lib/coinbase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const charge = await createCharge({
      userId: user.id,
      privyId: user.privy_id,
    });

    await query(
      `INSERT INTO payments (user_id, provider, provider_charge_id, amount_usd, status)
         VALUES ($1, 'coinbase_commerce', $2, $3, 'pending')
       ON CONFLICT (provider_charge_id) DO NOTHING`,
      [user.id, charge.id, PLAN_PRICE_USD],
    );

    return NextResponse.json({ hosted_url: charge.hosted_url, charge_id: charge.id });
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
