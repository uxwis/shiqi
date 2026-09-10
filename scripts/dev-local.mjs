import { resolve } from "node:path";
import { startLocalPostgres } from "./local-postgres.mjs";
if (process.env.NODE_ENV === "production")
  throw new Error("This launcher is only for local development.");
const postgres = await startLocalPostgres({
  directory: resolve(".tools/postgres-preview"),
  databaseName: "shiqi_preview",
});
process.env.DATABASE_URL = postgres.url;
process.env.DATABASE_SSL = "false";
process.env.HOST = "127.0.0.1";
process.env.APP_ORIGIN ||= "http://127.0.0.1:" + (process.env.PORT || "4173");
let app, database;
try {
  const { createDatabase } = await import("../server/db.mjs");
  const { migrateDatabase } = await import("../server/migrations.mjs");
  const { seedDatabase } = await import("../server/seed.mjs");
  const { startServer } = await import("../server/app.mjs");
  database = createDatabase();
  await migrateDatabase(database);
  await seedDatabase(database, { production: false });
  app = await startServer({ database });
  console.log(
    `拾器本地预览：${process.env.APP_ORIGIN} · PostgreSQL ${postgres.version}`,
  );
  console.log(
    "数据保存在 .tools/postgres-preview；重启此命令可继续使用。仅监听本机，不用于生产。",
  );
} catch (error) {
  await database?.close();
  await postgres.close();
  throw error;
}
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  app.maintenance.stop();
  app.server.closeAllConnections();
  await new Promise((r) => app.server.close(r));
  await database.close();
  await postgres.close();
}
process.once("SIGINT", () => shutdown().finally(() => process.exit()));
process.once("SIGTERM", () => shutdown().finally(() => process.exit()));
