import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import type { ApiKeyRow } from "@/lib/keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;

    const { rows } = await query<ApiKeyRow>(
      `UPDATE api_keys SET status = 'revoked'
        WHERE id = $1 AND user_id = $2
        RETURNING id, name, prefix, status, created_at, last_used_at`,
      [id, user.id],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ key: rows[0] });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("/api/keys DELETE error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
