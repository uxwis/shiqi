import { readdir, readFile } from "node:fs/promises";
const directory = new URL("../migrations/", import.meta.url);
export async function migrateDatabase(database, { preview = false } = {}) {
  if (!preview)
    await database.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    );
  let applied = new Set();
  try {
    applied = new Set(
      (await database.query("SELECT name FROM schema_migrations")).rows.map(
        (r) => r.name,
      ),
    );
  } catch (error) {
    if (
      !preview ||
      (error.code !== "42P01" &&
        !/relation "schema_migrations" does not exist/i.test(error.message))
    )
      throw error;
  }
  const pending = (await readdir(directory))
    .filter((f) => f.endsWith(".sql") && !applied.has(f))
    .sort();
  if (!preview)
    for (const name of pending)
      await database.transaction(async (client) => {
        await client.query(await readFile(new URL(name, directory), "utf8"));
        await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [
          name,
        ]);
      });
  return { mode: preview ? "preview" : "applied", migrations: pending };
}
