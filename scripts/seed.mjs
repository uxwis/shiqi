import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

const [{ createDatabase }, { seedDatabase }] = await Promise.all([
  import("../server/db.mjs"),
  import("../server/seed.mjs"),
]);

const database = createDatabase();
try {
  const result = await seedDatabase(database);
  console.log(`Seed complete: ${result.resources} resources, ${result.articles} articles.`);
} finally {
  await database.close();
}
