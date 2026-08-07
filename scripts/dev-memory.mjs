import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { newDb } from "pg-mem";
import { createDatabase } from "../server/db.mjs";
import { createRepository } from "../server/repository.mjs";
import { seedDatabase } from "../server/seed.mjs";
import { createApp } from "../server/app.mjs";
import { config } from "../server/config.mjs";

const memory = newDb({ autoCreateForeignKeyIndices: true });
const adapter = memory.adapters.createPg();
const database = createDatabase(new adapter.Pool());
const migration = await readFile(new URL("../migrations/001_initial.sql", import.meta.url), "utf8");
await database.query(migration);
await seedDatabase(database, { production: false });

const repository = createRepository(database);
const app = createApp({ database, repository });
await repository.deleteExpiredSessions();
const server = createServer(app.handler);
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(config.port, config.host, resolve);
});

console.log(`拾器内存开发服务器：http://${config.host}:${config.port}`);

async function shutdown() {
  await new Promise(resolve => server.close(resolve));
  await database.close();
}

process.once("SIGINT", () => shutdown().finally(() => process.exit(0)));
process.once("SIGTERM", () => shutdown().finally(() => process.exit(0)));
