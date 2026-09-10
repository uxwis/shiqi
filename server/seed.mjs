import { config } from "./config.mjs";
import { createRepository } from "./repository.mjs";
import { hashPassword } from "./security.mjs";
// Production initialization creates only the explicitly configured administrator.
// Samples are imported explicitly by demo-content.mjs, never during startup.
export async function seedDatabase(
  db,
  { production = config.production } = {},
) {
  const repo = createRepository(db);
  const email = config.admin.email || (!production ? "admin@example.com" : "");
  const password =
    config.admin.password || (!production ? "ShiqiDev12345" : "");
  if (email && password && !(await repo.getUserByEmail(email)))
    await repo.createUser({
      email,
      passwordHash: await hashPassword(password),
      nickname: config.admin.nickname,
      role: "admin",
    });
  return { resources: 0, articles: 0 };
}
