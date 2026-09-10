import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
const { createDatabase } = await import("../server/db.mjs");
const { createMaintenance } = await import("../server/maintenance.mjs");
const database = createDatabase();
try {
  console.log(JSON.stringify(await createMaintenance(database).run(), null, 2));
} finally {
  await database.close();
}
