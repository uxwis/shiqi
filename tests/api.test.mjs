import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { newDb } from "pg-mem";
import { createDatabase } from "../server/db.mjs";
import { createRepository } from "../server/repository.mjs";
import { createApp } from "../server/app.mjs";
import { hashPassword } from "../server/security.mjs";

async function createTestContext() {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = memory.adapters.createPg();
  const pool = new adapter.Pool();
  const database = createDatabase(pool);
  const migration = await readFile(new URL("../migrations/001_initial.sql", import.meta.url), "utf8");
  await database.query(migration);
  const repository = createRepository(database);
  const admin = await repository.createUser({ email: "admin@example.com", passwordHash: await hashPassword("AdminPass123"), nickname: "管理员", role: "admin" });
  let lastCode = "";
  const app = createApp({
    database,
    repository,
    mailer: async ({ code }) => { lastCode = code; return { developmentCode: code }; },
    imageStore: async () => "/uploads/test.png",
  });
  const server = createServer(app.handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseURL = `http://127.0.0.1:${address.port}`;

  async function request(path, { method = "GET", body, cookie, headers = {} } = {}) {
    const response = await fetch(`${baseURL}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = response.status === 204 ? null : await response.json();
    return { response, data, cookie: response.headers.get("set-cookie")?.split(";")[0] || "" };
  }

  return {
    admin,
    database,
    repository,
    request,
    get lastCode() { return lastCode; },
    async close() {
      await new Promise(resolve => server.close(resolve));
      await database.close();
    },
  };
}

test("registration, publishing and moderation use server state", async () => {
  const context = await createTestContext();
  try {
    const health = await context.request("/api/health");
    assert.equal(health.response.status, 200);
    assert.equal(health.data.ok, true);

    const code = await context.request("/api/auth/request-code", { method: "POST", body: { email: "user@example.com", purpose: "register" } });
    assert.equal(code.response.status, 200);
    assert.match(context.lastCode, /^\d{6}$/);

    const registration = await context.request("/api/auth/register", {
      method: "POST",
      body: { email: "user@example.com", nickname: "测试用户", password: "StrongPass123", code: context.lastCode, agreement: true },
    });
    assert.equal(registration.response.status, 201);
    assert.ok(registration.cookie.startsWith("shiqi_session="));
    const userCookie = registration.cookie;

    const createdTool = await context.request("/api/resources", {
      method: "POST",
      cookie: userCookie,
      body: {
        name: "测试工具",
        website: "https://example.com/tool",
        channel: "AI工具",
        category: "AI 对话写作",
        tags: ["测试", "效率"],
        summary: "帮助测试正式发布流程的示例工具。",
        reason: "这是一次完整的服务端发布测试，用于确认内容和发布记录能在同一事务中写入数据库。",
      },
    });
    assert.equal(createdTool.response.status, 201);
    const resourceId = createdTool.data.resource.id;

    const favorite = await context.request("/api/favorites/toggle", { method: "POST", cookie: userCookie, body: { targetType: "resource", targetId: resourceId } });
    assert.equal(favorite.response.status, 200);
    assert.equal(favorite.data.favorite, true);

    const comment = await context.request("/api/comments", { method: "POST", cookie: userCookie, body: { resourceId, rating: 5, content: "服务端评论发布正常。" } });
    assert.equal(comment.response.status, 201);
    const firstLike = await context.request(`/api/comments/${comment.data.comment.id}/like`, { method: "POST", cookie: userCookie, body: {} });
    const repeatedLike = await context.request(`/api/comments/${comment.data.comment.id}/like`, { method: "POST", cookie: userCookie, body: {} });
    assert.equal(firstLike.data.added, true);
    assert.equal(repeatedLike.data.added, false);

    const upload = await context.request("/api/uploads/images", { method: "POST", cookie: userCookie, body: { images: ["data:image/png;base64,test"] } });
    assert.equal(upload.response.status, 201);
    assert.deepEqual(upload.data.images, ["/uploads/test.png"]);

    const createdArticle = await context.request("/api/articles", { method: "POST", cookie: userCookie, body: {
      title: "服务端文章发布流程测试",
      excerpt: "这是一篇用于验证文章、图片与个人发布记录同步写入数据库的测试文章。",
      category: "工具教程",
      tags: ["测试", "发布"],
      images: upload.data.images,
      body: "第一段用于验证文章正文能够通过服务端内容规则并写入数据库。这里提供足够长度的真实测试文字。\n\n第二段继续验证图文文章发布流程，确保返回的文章可以进入公开列表并出现在个人中心的发布记录中。",
    } });
    assert.equal(createdArticle.response.status, 201);

    const report = await context.request("/api/reports", { method: "POST", cookie: userCookie, body: { targetId: resourceId, targetType: "resource", type: "信息错误", detail: "用于验证举报处理流程。" } });
    assert.equal(report.response.status, 201);

    const dashboard = await context.request("/api/me/dashboard", { cookie: userCookie });
    assert.equal(dashboard.response.status, 200);
    assert.equal(dashboard.data.submissions.length, 2);
    assert.deepEqual(dashboard.data.favorites, [{ type: "resource", id: resourceId }]);

    const adminLogin = await context.request("/api/auth/login", { method: "POST", body: { email: "admin@example.com", password: "AdminPass123" } });
    assert.equal(adminLogin.response.status, 200);
    const adminData = await context.request("/api/admin/data", { cookie: adminLogin.cookie });
    assert.equal(adminData.response.status, 200);
    assert.equal(adminData.data.reports.length, 1);

    const edited = await context.request(`/api/admin/resources/${resourceId}`, { method: "PATCH", cookie: adminLogin.cookie, body: {
      name: "管理员更新后的测试工具",
      website: "https://example.com/tool-updated",
      category: "AI工具",
      subcategory: "AI 对话写作",
      tags: ["测试", "维护"],
      short: "管理员已经通过服务端接口更新了这条测试工具信息。",
      description: "管理员更新详细介绍，用来验证后台编辑不会再写入浏览器本地存储，并且可以留下操作审计记录。",
      status: "online",
    } });
    assert.equal(edited.response.status, 200);
    assert.equal(edited.data.resource.name, "管理员更新后的测试工具");

    const resolved = await context.request(`/api/admin/reports/${report.data.report.id}`, { method: "PATCH", cookie: adminLogin.cookie, body: { status: "resolved" } });
    assert.equal(resolved.response.status, 200);
    assert.equal(resolved.data.status, "resolved");
  } finally {
    await context.close();
  }
});

test("authentication and mutation routes enforce permissions", async () => {
  const context = await createTestContext();
  try {
    const anonymousPublish = await context.request("/api/resources", { method: "POST", body: {} });
    assert.equal(anonymousPublish.response.status, 401);

    const badLogin = await context.request("/api/auth/login", { method: "POST", body: { email: "admin@example.com", password: "wrong-password" } });
    assert.equal(badLogin.response.status, 401);

    const bootstrap = await context.request("/api/bootstrap");
    assert.equal(bootstrap.response.status, 200);
    assert.equal(bootstrap.data.currentUser, null);
    assert.deepEqual(bootstrap.data.resources, []);

    const foreignOrigin = await context.request("/api/auth/login", { method: "POST", headers: { Origin: "https://attacker.example" }, body: { email: "admin@example.com", password: "AdminPass123" } });
    assert.equal(foreignOrigin.response.status, 403);

    await context.request("/api/auth/request-code", { method: "POST", body: { email: "admin@example.com", purpose: "reset" } });
    const reset = await context.request("/api/auth/reset-password", { method: "POST", body: { email: "admin@example.com", code: context.lastCode, password: "ChangedPass123" } });
    assert.equal(reset.response.status, 200);
    const changedLogin = await context.request("/api/auth/login", { method: "POST", body: { email: "admin@example.com", password: "ChangedPass123" } });
    assert.equal(changedLogin.response.status, 200);
  } finally {
    await context.close();
  }
});
