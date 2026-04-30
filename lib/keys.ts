import { createHash, randomBytes } from "node:crypto";

export type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  status: "active" | "revoked";
  created_at: string;
  last_used_at: string | null;
};

export function generateSecret(): { secret: string; prefix: string; hash: string } {
  const random = randomBytes(20).toString("hex");
  const secret = `pk_live_${random}`;
  const prefix = secret.slice(0, 12);
  const hash = createHash("sha256").update(secret).digest("hex");
  return { secret, prefix, hash };
}
