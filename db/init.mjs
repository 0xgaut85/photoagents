import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, "schema.sql");
const url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!url) {
  console.error(
    "DATABASE_PUBLIC_URL or DATABASE_URL must be set. Run via: railway run npm run db:init",
  );
  process.exit(1);
}

const sql = readFileSync(schemaPath, "utf8");
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("railway") || url.includes("rlwy.net") ? { rejectUnauthorized: false } : undefined,
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Schema applied.");
} catch (error) {
  console.error("Failed to apply schema:", error);
  process.exit(1);
} finally {
  await client.end();
}
