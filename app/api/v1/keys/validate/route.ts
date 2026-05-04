import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { effectivePlanStatus } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ValidatePayload = {
  api_key?: unknown;
  client_version?: unknown;
};

type KeyRow = {
  id: string;
  user_id: string;
  status: string;
  plan_status: string;
  plan_renews_at: string | null;
  trial_ends_at: string | null;
};

function reject(reason: string) {
  return NextResponse.json(
    { valid: false, reason },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

function accept(tier: "pro" | "trial", expires_at: string | null) {
  return NextResponse.json(
    { valid: true, tier, expires_at },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  let body: ValidatePayload;
  try {
    body = (await req.json()) as ValidatePayload;
  } catch {
    return NextResponse.json(
      { valid: false, reason: "invalid_json" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const apiKey = typeof body.api_key === "string" ? body.api_key.trim() : "";
  if (!apiKey) {
    return NextResponse.json(
      { valid: false, reason: "missing_api_key" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const hash = createHash("sha256").update(apiKey).digest("hex");

  try {
    const { rows } = await query<KeyRow>(
      `SELECT k.id, k.user_id, k.status,
              u.plan_status, u.plan_renews_at, u.trial_ends_at
         FROM api_keys k
         JOIN users u ON u.id = k.user_id
        WHERE k.hash = $1
        LIMIT 1`,
      [hash],
    );

    const row = rows[0];
    if (!row) return reject("unknown_key");
    if (row.status !== "active") return reject("revoked");

    const status = effectivePlanStatus({
      plan_renews_at: row.plan_renews_at,
      trial_ends_at: row.trial_ends_at,
    });

    if (status === "expired") {
      return reject("trial_or_subscription_expired");
    }

    void query(`UPDATE api_keys SET last_used_at = now() WHERE id = $1`, [row.id]).catch(
      (err) => {
        console.error("/v1/keys/validate touch last_used_at failed:", err);
      },
    );

    if (status === "paid") {
      return accept("pro", row.plan_renews_at);
    }
    return accept("trial", row.trial_ends_at);
  } catch (error) {
    console.error("/v1/keys/validate error:", error);
    return NextResponse.json(
      { valid: false, reason: "server_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
