import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new Pool({
    connectionString,
    ssl: connectionString.includes("railway") || connectionString.includes("rlwy.net")
      ? { rejectUnauthorized: false }
      : undefined,
    max: 5,
    idleTimeoutMillis: 30_000,
  });
}

export function getPool(): Pool {
  if (global.__pgPool) return global.__pgPool;
  const pool = createPool();
  if (process.env.NODE_ENV !== "production") {
    global.__pgPool = pool;
  } else {
    global.__pgPool = pool;
  }
  return pool;
}

export async function query<T = unknown>(
  text: string,
  params: unknown[] = [],
): Promise<{ rows: T[] }> {
  const result = await getPool().query(text, params);
  return { rows: result.rows as T[] };
}
