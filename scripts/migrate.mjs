import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
if (existsSync(".env")) process.loadEnvFile(".env");
const { createDatabase } = await import("../server/db.mjs");
const { migrateDatabase } = await import("../server/migrations.mjs");
const database = createDatabase();
try {
  const report = await migrateDatabase(database, {
    preview: process.argv.includes("--preview"),
  });
  report.generatedAt = new Date().toISOString();
  report.legacyContent = [];
  for (const [type, table, title] of [
    ["resource", "resources", "name"],
    ["article", "articles", "title"],
  ]) {
    const columns = (
      await database.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1",
        [table],
      )
    ).rows.map((r) => r.column_name);
    if (!columns.includes(title)) continue;
    const filter = columns.includes("scope")
      ? " WHERE scope='legacy_review'"
      : "";
    const rows = (
      await database.query(
        `SELECT id,${title} AS title,user_id,status,created_at FROM ${table}${filter} ORDER BY id`,
      )
    ).rows;
    report.legacyContent.push(
      ...rows.map((row) => ({
        type,
        ...row,
        action: "excluded-from-public-until-reviewed",
      })),
    );
  }
  const output = JSON.stringify(report, null, 2);
  const reportPath = process.argv
    .find((arg) => arg.startsWith("--report="))
    ?.slice(9);
  if (reportPath) await writeFile(reportPath, output + "\n");
  console.log(output);
} finally {
  await database.close();
}
