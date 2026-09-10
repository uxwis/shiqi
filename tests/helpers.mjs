import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { newDb } from "pg-mem";
import pg from "pg";
import { createDatabase } from "../server/db.mjs";
import { migrateDatabase } from "../server/migrations.mjs";
import { createApp } from "../server/app.mjs";
import { createRepository } from "../server/repository.mjs";
import { hashPassword } from "../server/security.mjs";
export async function testDatabase({ migrate = true } = {}) {
  if (process.env.TEST_DATABASE_URL) {
    if (new URL(process.env.TEST_DATABASE_URL).pathname !== "/shiqi_test")
      throw new Error("Use an isolated shiqi_test database");
    const schema = "test_" + randomUUID().replaceAll("-", "");
    const setup = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    await setup.query(`CREATE SCHEMA ${schema}`);
    await setup.end();
    const database = createDatabase(
      new pg.Pool({
        connectionString: process.env.TEST_DATABASE_URL,
        options: `-c search_path=${schema}`,
      }),
    );
    if (migrate) await migrateDatabase(database);
    return database;
  }
  const memory = newDb({
    autoCreateForeignKeyIndices: true,
    noAstCoverageCheck: true,
  });
  const adapter = memory.adapters.createPg();
  const database = createDatabase(new adapter.Pool());
  if (migrate) await migrateDatabase(database);
  return database;
}
export async function context(options = {}) {
  const database = await testDatabase(),
    repository = createRepository(database, { now: options.now });
  let code = "";
  const admin = await repository.createUser({
    email: "admin@example.com",
    passwordHash: await hashPassword("AdminPass123"),
    nickname: "管理员",
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
    ...options,
    imageStore: async () => "/uploads/test.png",
    mailer: async (value) => {
      code = value.code;
      return { developmentCode: code };
    },
  });
  const server = createServer(app.handler);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const baseURL = `http://127.0.0.1:${server.address().port}`;
  async function request(
    path,
    { method = "GET", body, cookie, headers = {} } = {},
  ) {
    const response = await fetch(baseURL + path, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return {
      response,
      data,
      cookie: response.headers.get("set-cookie")?.split(";")[0] || "",
    };
  }
  const login = async (email, password) =>
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { email, password },
      })
    ).cookie;
  return {
    database,
    repository,
    ...app,
    admin,
    user,
    request,
    baseURL,
    get code() {
      return code;
    },
    login,
    async close() {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
      await database.close();
    },
  };
}
export const resourceInput = {
  name: "建筑方案 AI 工作流",
  domain: "design",
  kind: "workflow",
  aiUse: "使用 AI 将建筑草图转化为可比较的空间效果方案。",
  description:
    "输入建筑草图和设计约束，通过生成模型完成方案表达，并人工核对结构与比例。",
  industries: ["建筑", "服装"],
  platforms: ["测试平台"],
  tags: ["方案表达"],
  website: "https://example.com/workflow",
  details: {
    version: "test-v1",
    cost: "自备算力或平台额度",
    requirements: "测试环境与输入图像",
    output: "形成可比较的方案图像",
  },
};
export const articleInput = {
  title: "建筑草图到 AI 方案的完整实践",
  domain: "design",
  kind: "tutorial",
  aiUse: "使用 AI 工作流把建筑草图转为视觉方案，并核对生成结果。",
  industries: ["建筑"],
  body: [
    "先准备一张具有清晰尺度标注的建筑草图，明确输入条件和期望的视觉结果。再选择支持条件控制的 AI 模型，固定必要的模型版本与参数，执行生成流程。完成后逐项检查比例、空间关系和材质是否满足目标，并记录失败情况和调整过程，确保其他读者可以使用相同条件复现。",
  ],
  details: {
    origin: "original",
    version: "test-v1",
    cost: "自备算力",
    requirements: "使用测试模型和输入草图",
    output: "获得可复现的方案表达",
  },
};
