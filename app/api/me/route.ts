import { NextResponse } from "next/server";
import { AuthError, effectivePlanStatus, requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const effective = effectivePlanStatus(user);
    return NextResponse.json({
      user: {
        ...user,
        plan_status: effective,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("/api/me error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
