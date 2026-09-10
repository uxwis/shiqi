import { newDb } from "pg-mem";
import { createDatabase } from "../server/db.mjs";
import { migrateDatabase } from "../server/migrations.mjs";
import { seedDatabase } from "../server/seed.mjs";
import { startServer } from "../server/app.mjs";
import { config } from "../server/config.mjs";
const memory = newDb({
  autoCreateForeignKeyIndices: true,
  noAstCoverageCheck: true,
});
const adapter = memory.adapters.createPg();
const database = createDatabase(new adapter.Pool());
await migrateDatabase(database);
await seedDatabase(database, { production: false });
const app = await startServer({ database });
console.log(
  `拾器内存开发服务器：http://${config.host}:${config.port}（进程退出后数据清空）`,
);
const shutdown = async () => {
  app.maintenance.stop();
  app.server.closeAllConnections();
  await new Promise((r) => app.server.close(r));
  await database.close();
};
process.once("SIGINT", () => shutdown().finally(() => process.exit()));
process.once("SIGTERM", () => shutdown().finally(() => process.exit()));
