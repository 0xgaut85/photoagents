import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  amount_usd: string;
  status: "pending" | "confirmed" | "failed" | "expired";
  created_at: string;
  confirmed_at: string | null;
};

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const { rows } = await query<Row>(
      `SELECT id, amount_usd, status, created_at, confirmed_at
         FROM payments
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 24`,
      [user.id],
    );
    return NextResponse.json({ payments: rows });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("/api/billing/invoices error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
