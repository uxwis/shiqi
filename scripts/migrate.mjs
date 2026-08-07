import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

if (existsSync(".env")) process.loadEnvFile(".env");

const { createDatabase } = await import("../server/db.mjs");
const database = createDatabase();
const migrationsDirectory = resolve(process.cwd(), "migrations");

try {
  await database.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const applied = new Set((await database.query("SELECT name FROM schema_migrations")).rows.map(row => row.name));
  const files = (await readdir(migrationsDirectory)).filter(file => file.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(resolve(migrationsDirectory, file), "utf8");
    await database.transaction(async client => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    });
    console.log(`Applied migration ${file}`);
  }
} finally {
  await database.close();
}
