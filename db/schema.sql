-- Idempotent bootstrap. Run with: npm run db:init
-- Requires the pgcrypto extension for gen_random_uuid().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id        text UNIQUE NOT NULL,
  email           text,
  wallet_address  text,
  display_name    text,
  plan_status     text NOT NULL DEFAULT 'free',
  plan_renews_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            text NOT NULL,
  provider_charge_id  text UNIQUE NOT NULL,
  amount_usd          numeric(10,2) NOT NULL,
  amount_usdc         numeric(20,6),
  status              text NOT NULL,
  tx_hash             text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  confirmed_at        timestamptz
);

CREATE TABLE IF NOT EXISTS api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  prefix        text NOT NULL,
  hash          text NOT NULL,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_keys_user ON api_keys(user_id);
