import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { type ApiKeyRow, generateSecret } from "@/lib/keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const { rows } = await query<ApiKeyRow>(
      `SELECT id, name, prefix, status, created_at, last_used_at
         FROM api_keys
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [user.id],
    );
    return NextResponse.json({ keys: rows });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("/api/keys GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as { name?: string };
    const name = (body.name ?? "Untitled key").toString().slice(0, 80) || "Untitled key";

    const { secret, prefix, hash } = generateSecret();
    const { rows } = await query<ApiKeyRow>(
      `INSERT INTO api_keys (user_id, name, prefix, hash)
         VALUES ($1, $2, $3, $4)
       RETURNING id, name, prefix, status, created_at, last_used_at`,
      [user.id, name, prefix, hash],
    );

    return NextResponse.json({ key: rows[0], secret });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("/api/keys POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
