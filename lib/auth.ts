import { PrivyClient } from "@privy-io/server-auth";
import { query } from "./db";

export type AppUser = {
  id: string;
  privy_id: string;
  email: string | null;
  wallet_address: string | null;
  display_name: string | null;
  plan_status: "free" | "paid";
  plan_renews_at: string | null;
  created_at: string;
  last_seen_at: string;
};

let cachedClient: PrivyClient | null = null;

export function getPrivy() {
  if (cachedClient) return cachedClient;
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET must be set");
  }
  cachedClient = new PrivyClient(appId, appSecret);
  return cachedClient;
}

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export function bearerToken(req: Request): string {
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new AuthError("Missing access token");
  return token;
}

export async function requireUser(req: Request): Promise<AppUser> {
  const token = bearerToken(req);
  const claims = await getPrivy().verifyAuthToken(token);
  return upsertUser(claims.userId);
}

export async function upsertUser(privyId: string): Promise<AppUser> {
  const fresh = await getPrivy().getUserById(privyId);
  const email = fresh.email?.address ?? fresh.google?.email ?? null;
  const wallet = fresh.wallet?.address ?? null;
  const displayName =
    fresh.google?.name ?? fresh.twitter?.username ?? fresh.email?.address ?? null;

  const { rows } = await query<AppUser>(
    `INSERT INTO users (privy_id, email, wallet_address, display_name)
       VALUES ($1, $2, $3, $4)
     ON CONFLICT (privy_id) DO UPDATE SET
       email = COALESCE(EXCLUDED.email, users.email),
       wallet_address = COALESCE(EXCLUDED.wallet_address, users.wallet_address),
       display_name = COALESCE(EXCLUDED.display_name, users.display_name),
       last_seen_at = now()
     RETURNING *`,
    [privyId, email, wallet, displayName],
  );

  return rows[0];
}
