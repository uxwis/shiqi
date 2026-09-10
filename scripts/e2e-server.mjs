import { createServer } from "node:http";
import {
  testDatabase,
  resourceInput,
  articleInput,
} from "../tests/helpers.mjs";
import { createApp } from "../server/app.mjs";
import { createRepository } from "../server/repository.mjs";
import { hashPassword } from "../server/security.mjs";
const database = await testDatabase(),
  repository = createRepository(database);
const admin = await repository.createUser({
  email: "admin@example.com",
  passwordHash: await hashPassword("AdminPass123"),
  nickname: "测试管理员",
  role: "admin",
});
const user = await repository.createUser({
  email: "user@example.com",
  passwordHash: await hashPassword("StrongPass123"),
  nickname: "测试作者",
});
const app = createApp({
  database,
  repository,
  linkChecker: async () => ({
    status: "needs_check",
    httpStatus: 403,
    note: "浏览器测试模拟访问限制",
  }),
  mailer: async ({ code }) => ({ developmentCode: code }),
});
// Fixtures are isolated from development and production startup.
const r = await app.service.save(
  "resource",
  { ...resourceInput, name: "浏览器测试 · 建筑方案工作流" },
  user,
);
await app.service.save(
  "article",
  {
    ...articleInput,
    title: "浏览器测试 · 建筑方案实践",
    resourceIds: [r.item.id],
  },
  user,
);
const server = createServer(app.handler);
await new Promise((r) => server.listen(4189, "127.0.0.1", r));
console.log("E2E server http://127.0.0.1:4189");
const stop = async () => {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await database.close();
};
process.on("SIGTERM", () => stop().finally(() => process.exit()));
process.on("SIGINT", () => stop().finally(() => process.exit()));
