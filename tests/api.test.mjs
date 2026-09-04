import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { newDb } from "pg-mem";
import { createDatabase } from "../server/db.mjs";
import { createRepository } from "../server/repository.mjs";
import { createApp } from "../server/app.mjs";
import { hashPassword } from "../server/security.mjs";

async function createTestContext({ metadataReader, now } = {}) {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = memory.adapters.createPg();
  const pool = new adapter.Pool();
  const database = createDatabase(pool);
  const migrationDirectory = new URL("../migrations/", import.meta.url);
  for (const filename of (await readdir(migrationDirectory)).filter(name => name.endsWith(".sql")).sort()) {
    await database.query(await readFile(new URL(filename, migrationDirectory), "utf8"));
  }
  const repository = createRepository(database, { now });
  const admin = await repository.createUser({ email: "admin@example.com", passwordHash: await hashPassword("AdminPass123"), nickname: "管理员", role: "admin" });
  let lastCode = "";
  const app = createApp({
    database,
    repository,
    metadataReader,
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

test("online publishing, optional rich article summaries, metadata and real views round trip", async () => {
  const context = await createTestContext({ metadataReader: async () => ({ image: "https://example.com/og.png", title: "示例", description: "用于验证的官网介绍，内容来源于公开网站。" }) });
  try {
    const login = await context.request("/api/auth/login", { method: "POST", body: { email: "admin@example.com", password: "AdminPass123" } });
    const cookie = login.cookie;
    const tool = await context.request("/api/resources", { method: "POST", cookie, body: { name: "在线测试工具", website: "https://example.com", channel: "在线工具", category: "在线工具", summary: "支持在线处理常见任务的示例工具。", reason: "提供在线使用入口与具体使用场景，供测试发布、分类和浏览量统计功能。", tags: ["测试"] } });
    assert.equal(tool.response.status, 201);
    const id = tool.data.resource.id;
    assert.equal(tool.data.resource.category, "软件工具");
    assert.equal(tool.data.resource.subcategory, "在线工具");
    assert.equal(tool.data.resource.views, 0);
    await context.database.query("UPDATE resources SET views_count=99000 WHERE id=$1", [id]);
    assert.equal((await context.request(`/api/resources/${id}/view`, { method: "POST", body: {} })).data.views, 1);
    assert.equal((await context.request(`/api/resources/${id}/view`, { method: "POST", body: {} })).data.views, 2);
    assert.equal((await context.request(`/api/resources/missing/view`, { method: "POST", body: {} })).response.status, 404);
    assert.equal((await context.request(`/api/resources/${id}/metadata`)).data.image, "https://example.com/og.png");
    const richBody = [{ type: "h2", content: [{ text: "学习方法", bold: true }] }, { type: "p", content: [{ text: "从真实场景开始学习，记录操作过程并及时总结结果。".repeat(5), italic: true }] }, { type: "ol", items: [[{ text: "查看文档", href: "https://example.com/" }], [{ text: "执行步骤" }]] }];
    const article = await context.request("/api/articles", { method: "POST", cookie, body: { title: "可以留空摘要的富文本文章", category: "学习方法", body: richBody } });
    assert.equal(article.response.status, 201);
    assert.equal(article.data.article.excerpt, "");
    assert.deepEqual(article.data.article.body, richBody);
    const dashboard = await context.request("/api/me/dashboard", { cookie });
    const submission = dashboard.data.submissions.find(item => item.targetId === article.data.article.id);
    const update = await context.request(`/api/submissions/${submission.id}`, { method: "PATCH", cookie, body: { title: "更新后的富文本学习文章", category: "学习方法", excerpt: "", body: richBody } });
    assert.equal(update.response.status, 200);
    const bootstrap = await context.request("/api/bootstrap");
    assert.deepEqual(bootstrap.data.articles.find(item => item.id === article.data.article.id).body, richBody);
    assert.equal(bootstrap.data.resources.find(item => item.id === id).views, 2);
  } finally { await context.close(); }
});

test("tools publish and remain editable without a secondary category or introduction", async () => {
  const context = await createTestContext();
  try {
    const login = await context.request("/api/auth/login", { method: "POST", body: { email: "admin@example.com", password: "AdminPass123" } });
    const cookie = login.cookie;
    for (const channel of ["AI工具", "软件工具", "在线工具"]) {
      const fields = { name: `精简发布${channel}`, website: "https://example.com/", channel, reason: "记录具体使用场景和实际操作过程，提供足够的信息帮助读者判断是否适合自己。", tags: [] };
      const result = await context.request("/api/resources", { method: "POST", cookie, body: fields });
      assert.equal(result.response.status, 201);
      assert.equal(result.data.resource.short, "");
      assert.equal(result.data.resource.subcategory, channel === "在线工具" ? "在线工具" : "");
      assert.equal(result.data.resource.description, fields.reason);
      const dashboard = await context.request("/api/me/dashboard", { cookie });
      const submission = dashboard.data.submissions.find(item => item.targetId === result.data.resource.id);
      const edited = await context.request(`/api/submissions/${submission.id}`, { method: "PATCH", cookie, body: { ...fields, summary: "简短" } });
      assert.equal(edited.response.status, 200);
      const adminEdit = await context.request(`/api/admin/resources/${result.data.resource.id}`, { method: "PATCH", cookie, body: { name: fields.name, website: fields.website, category: channel, description: fields.reason, status: "online" } });
      assert.equal(adminEdit.response.status, 200);
      assert.equal(adminEdit.data.resource.short, "");
      assert.equal(adminEdit.data.resource.subcategory, channel === "在线工具" ? "在线工具" : "");
    }
  } finally { await context.close(); }
});

test("admin analytics count recorded visits across Shanghai day/month boundaries and ignore legacy counters", async () => {
  let timestamp = new Date("2026-08-31T15:59:59Z");
  const context = await createTestContext({ now: () => timestamp });
  try {
    await context.database.query("UPDATE analytics_tracking SET started_at=$1 WHERE name='content_views'", [new Date("2026-08-31T00:00:00Z")]);
    const login = await context.request("/api/auth/login", { method: "POST", body: { email: "admin@example.com", password: "AdminPass123" } });
    const cookie = login.cookie;
    let result = await context.request("/api/admin/data", { cookie });
    assert.equal(result.data.stats.registeredUsers, 1);
    assert.equal(result.data.stats.publishedContent, 0);
    assert.equal(result.data.stats.monthViews, 0);
    assert.deepEqual(result.data.stats.trend.map(entry => entry.views), [null, null, null, null, null, null, 0]);
    const created = await context.request("/api/resources", { method: "POST", cookie, body: { name: "真实统计工具", website: "https://example.com/", channel: "AI工具", reason: "这条工具用于验证真实访问记录，详情浏览与后台统计应保持一致且不受演示计数影响。" } });
    const resourceId = created.data.resource.id;
    const article = await context.request("/api/articles", { method: "POST", cookie, body: { title: "真实文章访问统计测试", category: "学习方法", body: "从实际问题出发，记录使用方法、实践过程与结果，检查访问统计是否使用真实记录。".repeat(3) } });
    const articleId = article.data.article.id;
    await context.database.query("UPDATE resources SET views_count=86000 WHERE id=$1", [resourceId]);
    await context.database.query("UPDATE articles SET views_count=72000 WHERE id=$1", [articleId]);
    await context.request(`/api/resources/${resourceId}/view`, { method: "POST", body: {} });
    await context.request(`/api/articles/${articleId}/view`, { method: "POST", body: {} });
    result = await context.request("/api/admin/data", { cookie });
    assert.equal(result.data.stats.monthViews, 2);
    assert.equal(result.data.stats.publishedContent, 2);
    assert.equal(result.data.resources[0].views, 1);
    assert.equal(result.data.articles[0].views, 1);

    timestamp = new Date("2026-08-31T16:00:00Z"); // September 1, 00:00 in Shanghai.
    const visits = await Promise.all(Array.from({ length: 5 }, () => context.request(`/api/resources/${resourceId}/view`, { method: "POST", body: {} })));
    assert.ok(visits.every(item => item.response.status === 200));
    await context.request(`/api/articles/${articleId}/view`, { method: "POST", body: {} });
    const report = await context.request("/api/reports", { method: "POST", cookie, body: { targetId: resourceId, targetType: "resource", type: "信息错误", detail: "等待处理的真实测试举报。" } });
    result = await context.request("/api/admin/data", { cookie });
    assert.equal(result.data.stats.monthViews, 6);
    assert.equal(result.data.stats.pendingReports, 1);
    assert.equal(result.data.stats.registeredUsers, 1);
    assert.deepEqual(result.data.stats.trend.slice(-2), [{ day: "2026-08-31", views: 2 }, { day: "2026-09-01", views: 6 }]);
    assert.equal(result.data.resources[0].views, 6);
    assert.equal(result.data.articles[0].views, 2);
    assert.equal(result.data.stats.updatedAt, timestamp.toISOString());

    await context.request(`/api/admin/resources/${resourceId}/status`, { method: "PATCH", cookie, body: { status: "offline" } });
    assert.equal((await context.request(`/api/resources/${resourceId}/view`, { method: "POST", body: {} })).response.status, 404);
    assert.equal((await context.request("/api/articles/missing/view", { method: "POST", body: {} })).response.status, 404);
    await context.request(`/api/admin/reports/${report.data.report.id}`, { method: "PATCH", cookie, body: { status: "resolved" } });
    result = await context.request("/api/admin/data", { cookie });
    assert.equal(result.data.stats.publishedContent, 1);
    assert.equal(result.data.stats.monthViews, 6);
    assert.equal(result.data.stats.pendingReports, 0);

    // Read through a new repository instance: counters live in the database.
    const restartedRepository = createRepository(context.database, { now: () => timestamp });
    assert.equal((await restartedRepository.adminData()).stats.monthViews, 6);
    timestamp = new Date("2026-09-01T16:00:00Z");
    result = await context.request("/api/admin/data", { cookie });
    assert.deepEqual(result.data.stats.trend.at(-1), { day: "2026-09-02", views: 0 });
    assert.equal(result.data.stats.monthViews, 6);
    assert.equal((await context.request("/api/admin/data")).response.status, 401);
  } finally { await context.close(); }
});
