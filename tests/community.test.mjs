import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import {
  context,
  testDatabase,
  resourceInput,
  articleInput,
} from "./helpers.mjs";
import { createMaintenance } from "../server/maintenance.mjs";
import { createLinkChecker } from "../server/link-check.mjs";
import { migrateDatabase } from "../server/migrations.mjs";
const verification = {
  revision: 1,
  method: "editor_tested",
  environment: "验证环境 v1",
  evidence: "以明确输入完成任务，检查输出结果与预期一致。",
};
const action = (name, revision = 1) => ({
  action: name,
  revision,
  reason: "编辑已核对当前内容并记录处理结果",
});

test("material revisions invalidate prior endorsement and isolate reproduction feedback", async () => {
  const c = await context();
  try {
    const { item } = await c.service.save("resource", resourceInput, c.user),
      ref = { type: "resource", id: item.id };
    await assert.rejects(c.service.verify(ref, verification, c.user), /管理员/);
    await c.service.verify(ref, verification, c.admin);
    await c.service.moderate(ref, action("feature"), c.admin);
    assert.equal(
      (await c.service.list("resource", { featured: "true" })).total,
      1,
    );
    await c.service.feedback(
      ref,
      { revision: 1, outcome: "success", environment: "测试环境" },
      c.user,
    );
    const before = (await c.service.detail("resource", item.id)).item;
    await c.service.verify(
      ref,
      { ...verification, method: "author_tested" },
      c.user,
    );
    const preserved = (await c.service.detail("resource", item.id)).item;
    assert.equal(preserved.verificationMethod, "editor_tested");
    assert.equal(preserved.verifiedAt, before.verifiedAt);
    const changed = await c.service.save(
      "resource",
      {
        revision: 1,
        website: "https://example.com/v2",
        details: { version: "test-v2", updateNote: "更新模型版本和获取地址" },
      },
      c.user,
      item.id,
    );
    assert.equal(changed.item.revision, 2);
    assert.equal(changed.item.freshness, "review_due");
    assert.equal(changed.item.featured, false);
    assert.equal(changed.item.verifiedAt, null);
    assert.equal(changed.feedback.length, 0);
    assert.equal(changed.verifications.length, 2);
    assert.equal((await c.service.list("resource")).total, 0);
    await assert.rejects(c.service.verify(ref, verification, c.admin), /版本/);
    await assert.rejects(
      c.service.save(
        "resource",
        { revision: 1, name: "过期编辑" },
        c.user,
        item.id,
      ),
      /更新/,
    );
    await c.service.verify(ref, { ...verification, revision: 2 }, c.admin);
    assert.equal((await c.service.list("resource")).total, 1);
    assert.equal(
      (await c.service.detail("resource", item.id)).item.featured,
      false,
    );
  } finally {
    await c.close();
  }
});

test("expiry is enforced by every public query when maintenance is disabled", async () => {
  let now = new Date("2026-06-01T00:00:00Z");
  const c = await context({ now: () => now });
  try {
    const { item } = await c.service.save(
      "resource",
      { ...resourceInput, kind: "tool" },
      c.user,
    );
    await c.service.verify(
      { type: "resource", id: item.id },
      { ...verification, method: "source_checked" },
      c.admin,
    );
    await c.service.moderate(
      { type: "resource", id: item.id },
      action("feature"),
      c.admin,
    );
    now = new Date("2026-06-16T00:00:00Z");
    assert.equal((await c.service.list("resource")).total, 0);
    assert.equal((await c.service.search({ q: "建筑" })).total, 0);
    assert.equal((await c.service.home()).featured.total, 0);
    assert.equal(
      (await c.service.detail("resource", item.id)).item.freshness,
      "review_due",
    );
    const html = await c.request("/resources/" + item.id);
    assert.match(html.data, /noindex,follow/);
    assert.doesNotMatch(
      (await c.request("/sitemap.xml")).data,
      new RegExp(item.id),
    );
    const dashboard = await c.request("/api/me/dashboard", {
      cookie: await c.login("user@example.com", "StrongPass123"),
    });
    assert.equal(
      dashboard.response.status,
      200,
      JSON.stringify(dashboard.data),
    );
    assert.equal(dashboard.data.reminderTotal, 1);
  } finally {
    await c.close();
  }
});

test("unverified contributions cannot remain on default lists indefinitely", async () => {
  let now = new Date("2026-06-01");
  const c = await context({ now: () => now });
  try {
    const { item } = await c.service.save("resource", resourceInput, c.user);
    assert.equal(item.freshness, "unverified");
    now = new Date("2026-07-02");
    assert.equal((await c.service.list("resource")).total, 0);
    assert.equal(
      (await c.service.detail("resource", item.id)).item.freshness,
      "review_due",
    );
  } finally {
    await c.close();
  }
});

test("catalog and search pagination are stable and exact industry filters work", async () => {
  const c = await context();
  try {
    for (let i = 0; i < 5; i++)
      await c.service.save(
        "resource",
        {
          ...resourceInput,
          name: "AI 建筑任务 " + i,
          domain: i % 2 ? "coding" : "design",
        },
        c.user,
      );
    const first = await c.service.list("resource", { pageSize: 2 }),
      second = await c.service.list("resource", { pageSize: 2, page: 2 });
    assert.equal(first.total, 5);
    assert.equal(
      new Set([...first.items, ...second.items].map((i) => i.id)).size,
      4,
    );
    assert.equal(
      (await c.service.list("resource", { pageSize: 500 })).pageSize,
      50,
    );
    assert.equal(
      (await c.service.list("resource", { q: "' OR 1=1 --" })).total,
      0,
    );
    assert.equal(
      (await c.service.list("resource", { domain: "coding" })).total,
      2,
    );
    assert.equal(
      (await c.service.list("resource", { industry: "建筑" })).total,
      5,
    );
    assert.equal(
      (await c.service.list("resource", { industry: "建" })).total,
      0,
    );
    const creator = await c.request(
      "/api/creators/" + c.user.id + "?page=2&pageSize=2",
    );
    assert.equal(creator.data.resources.total, 5);
    assert.deepEqual(
      creator.data.resources.items.map((i) => i.id),
      second.items.map((i) => i.id),
    );
  } finally {
    await c.close();
  }
});

test("typed content references prevent ID collisions across articles and resources", async () => {
  const c = await context();
  try {
    const r = await c.service.save("resource", resourceInput, c.user),
      a = await c.service.save("article", articleInput, c.user);
    await c.database.query("UPDATE articles SET id=$1 WHERE id=$2", [
      r.item.id,
      a.item.id,
    ]);
    const cookie = await c.login("user@example.com", "StrongPass123");
    for (const targetType of ["article", "resource"]) {
      assert.equal(
        (
          await c.request("/api/favorites/toggle", {
            method: "POST",
            cookie,
            body: { targetType, targetId: r.item.id },
          })
        ).data.favorite,
        true,
      );
      await c.service.comment(
        { type: targetType, id: r.item.id },
        { content: targetType + " 的独立讨论" },
        c.user,
      );
      await c.service.feedback(
        { type: targetType, id: r.item.id },
        { revision: 1, outcome: "success", environment: "独立测试环境" },
        c.user,
      );
    }
    assert.equal(
      (await c.database.query("SELECT * FROM favorites")).rows.length,
      2,
    );
    for (const type of ["article", "resource"]) {
      const d = await c.service.detail(type, r.item.id);
      assert.equal(d.comments.length, 1);
      assert.match(d.comments[0].content, new RegExp(type));
      assert.equal(d.item.favorites, 1);
      assert.equal(d.feedback[0].count, 1);
    }
  } finally {
    await c.close();
  }
});

test("ordered topics filter unavailable content and dependencies request review", async () => {
  const c = await context();
  try {
    const r = await c.service.save("resource", resourceInput, c.user),
      a = await c.service.save(
        "article",
        { ...articleInput, resourceIds: [r.item.id] },
        c.user,
      );
    const topic = await c.service.saveTopic(
      {
        slug: "ai-building",
        title: "AI 建筑设计实践路径",
        description: "从草图资源到完整实践的顺序路径。",
        status: "online",
        items: [
          { type: "article", id: a.item.id },
          { type: "resource", id: r.item.id },
        ],
      },
      c.admin,
    );
    assert.deepEqual(
      topic.items.map((i) => i.type),
      ["article", "resource"],
    );
    await c.database.query(
      "UPDATE resources SET actual_views_count=17 WHERE id=$1",
      [r.item.id],
    );
    await c.database.query(
      "UPDATE articles SET actual_views_count=23 WHERE id=$1",
      [a.item.id],
    );
    await c.database.query("UPDATE resources SET cover_image='/uploads/topic-resource.png' WHERE id=$1", [r.item.id]);
    await c.database.query("UPDATE articles SET cover='/uploads/topic-article.png' WHERE id=$1", [a.item.id]);
    const summary = (await c.service.topics()).items.find(
      (item) => item.id === topic.id,
    );
    const detail = await c.service.topic("ai-building");
    assert.equal(summary.itemCount, 2);
    assert.equal(summary.totalViews, 40);
    assert.equal(detail.itemCount, detail.items.length);
    assert.equal(detail.totalViews, summary.totalViews);
    assert.equal(summary.previewCover, "/uploads/topic-article.png");
    assert.equal(detail.previewCover, summary.previewCover);
    assert.equal(summary.cover, "");
    await c.database.query("UPDATE topics SET cover='https://example.com/topic-custom.png' WHERE id=$1", [topic.id]);
    for (const path of ["/topics", "/topics/ai-building"]) {
      const page = await c.request(path);
      assert.equal(page.response.status, 200);
      assert.match(page.data, /收录 <strong>2<\/strong> 篇内容/);
      assert.match(page.data, /40 次浏览/);
      assert.match(page.data, /最后更新 <time datetime=/);
      assert.match(page.data, /class="topic-cover"/);
      assert.ok(page.data.includes('src="https://example.com/topic-custom.png"'));
    }
    await assert.rejects(
      c.service.saveTopic({ slug: "bad-topic", items: [] }, c.user),
      /管理员/,
    );
    await c.service.moderate(
      { type: "resource", id: r.item.id },
      {
        ...action("broken"),
        replacementURL: "https://example.com/replacement",
      },
      c.admin,
    );
    assert.equal(
      (await c.service.detail("article", a.item.id)).item.freshness,
      "review_due",
    );
    assert.equal((await c.service.topic("ai-building")).items.length, 0);
    const unavailable = (await c.service.topics()).items.find(
      (item) => item.id === topic.id,
    );
    assert.equal(unavailable.itemCount, 0);
    assert.equal(unavailable.totalViews, 0);
    assert.equal(unavailable.previewCover, "");
    assert.equal((await c.service.topic("ai-building")).totalViews, 0);
    const gone = await c.request("/resources/" + r.item.id);
    assert.equal(gone.response.status, 410);
    assert.match(gone.data, /example.com\/replacement/);
    assert.match(gone.data, /编辑已核对当前内容并记录处理结果/);
    assert.equal(
      (await c.request("/resources/missing-id")).response.status,
      404,
    );
    const updates = await c.service.updates();
    assert.equal(updates.total, 0);
  } finally {
    await c.close();
  }
});

test("link checks persist history and require repeated missing responses, never automatic invalidation", async () => {
  let now = new Date("2026-06-01"),
    response = { status: "needs_check", httpStatus: 429, note: "限流" };
  const c = await context({ now: () => now });
  try {
    const { item } = await c.service.save("resource", resourceInput, c.user);
    const job = createMaintenance(c.database, {
      now: () => now,
      check: async () => response,
    });
    await job.run();
    assert.equal(
      (await c.service.detail("resource", item.id)).item.freshness,
      "unverified",
    );
    now = new Date("2026-06-09");
    response = { status: "missing", httpStatus: 404, note: "疑似不存在" };
    await job.run();
    assert.equal(
      (await c.service.detail("resource", item.id)).item.freshness,
      "unverified",
    );
    now = new Date("2026-06-11");
    await job.run();
    assert.equal(
      (await c.service.detail("resource", item.id)).item.freshness,
      "review_due",
    );
    assert.equal((await c.service.raw("resource", item.id)).status, "online");
    assert.equal(
      (await c.database.query("SELECT * FROM link_check_history")).rows.length,
      3,
    );
    await c.service.verify(
      { type: "resource", id: item.id },
      verification,
      c.admin,
    );
    await assert.rejects(
      c.service.moderate(
        { type: "resource", id: item.id },
        action("feature"),
        c.admin,
      ),
      /链接异常/,
    );
    now = new Date("2026-06-19");
    response = { status: "ok", httpStatus: 200, note: "链接恢复" };
    await job.run();
    assert.equal(
      (await c.service.detail("resource", item.id)).item.featured,
      false,
    );
  } finally {
    await c.close();
  }
});

test("link checker validates DNS and every redirect, handles login, HTTP restrictions and fallback", async () => {
  const calls = [];
  let responses = [{ status: 302, location: "http://127.0.0.1/private" }];
  const checker = createLinkChecker({
    resolve: async (host) => [
      { address: host === "127.0.0.1" ? "127.0.0.1" : "8.8.8.8", family: 4 },
    ],
    transport: async (url, opts) => {
      calls.push({ url: url.href, ...opts });
      return responses.shift() || { status: 200 };
    },
  });
  assert.equal((await checker("https://example.com")).status, "unsafe");
  assert.equal(calls.length, 1);
  responses = [{ status: 302, location: "/login" }];
  assert.equal((await checker("https://example.com")).status, "needs_check");
  responses = [{ status: 405 }, { status: 206 }];
  assert.equal((await checker("https://example.com")).status, "ok");
  assert.equal(calls.at(-1).method, "GET");
  responses = [{ status: 403 }];
  assert.equal((await checker("https://example.com")).status, "needs_check");
  assert.equal((await checker("http://example.com:8888")).status, "unsafe");
  const mixed = createLinkChecker({
    resolve: async () => [
      { address: "8.8.8.8", family: 4 },
      { address: "10.0.0.1", family: 4 },
    ],
    transport: async () => {
      throw new Error("Should never execute");
    },
  });
  assert.equal((await mixed("https://example.com")).status, "unsafe");
});

test("migrations are repeatable and retain existing identifiers without public endorsement", async () => {
  const c = await context();
  try {
    assert.deepEqual((await migrateDatabase(c.database)).migrations, []);
    const { item } = await c.service.save("resource", resourceInput, c.user);
    await c.database.query(
      "UPDATE resources SET scope='legacy_review',featured=true WHERE id=$1",
      [item.id],
    );
    assert.equal((await c.service.list("resource")).total, 0);
    assert.equal((await c.service.raw("resource", item.id)).id, item.id);
    const before = (
      await c.database.query("SELECT COUNT(*) AS count FROM resources")
    ).rows[0].count;
    await migrateDatabase(c.database);
    assert.equal(
      (await c.database.query("SELECT COUNT(*) AS count FROM resources"))
        .rows[0].count,
      before,
    );
  } finally {
    await c.close();
  }
});

test(
  "real PostgreSQL transactions roll back and database constraints reject invalid feedback",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const c = await context();
    try {
      await assert.rejects(
        c.database.transaction(async (client) => {
          await client.query(
            "INSERT INTO catalog_tags(category,name) VALUES('task','rollback-only')",
          );
          throw new Error("rollback");
        }),
        /rollback/,
      );
      assert.equal(
        (
          await c.database.query(
            "SELECT * FROM catalog_tags WHERE name='rollback-only'",
          )
        ).rows.length,
        0,
      );
      await assert.rejects(
        c.database.query(
          "INSERT INTO reproduction_feedback(id,target_type,target_id,revision,user_id,outcome,environment) VALUES('bad','resource','missing',1,$1,'invalid','test')",
          [c.user.id],
        ),
      );
    } finally {
      await c.close();
    }
  },
);

test("upgrade rehearses a populated legacy database with read-only preview and preserves relationships", async () => {
  const database = await testDatabase({ migrate: false });
  try {
    const preview = await migrateDatabase(database, { preview: true });
    assert.equal(preview.migrations.length, 5);
    await database.query(
      "CREATE TABLE schema_migrations(name text PRIMARY KEY,applied_at timestamptz DEFAULT CURRENT_TIMESTAMP)",
    );
    for (const name of preview.migrations.slice(0, 4)) {
      await database.query(
        await readFile(
          new URL("../migrations/" + name, import.meta.url),
          "utf8",
        ),
      );
      await database.query("INSERT INTO schema_migrations(name) VALUES($1)", [
        name,
      ]);
    }
    await database.query(
      "INSERT INTO users(id,email,password_hash,nickname) VALUES('legacy-user','legacy@example.com','legacy-hash','原作者')",
    );
    await database.query(
      "INSERT INTO resources(id,name,logo,category,subcategory,color,logo_color,short_description,description,source,website,user_id,featured,actual_views_count) VALUES('legacy-resource','传统软件','','软件工具','','','','','历史介绍','','https://example.com','legacy-user',true,23)",
    );
    await database.query(
      "INSERT INTO favorites(user_id,target_type,target_id) VALUES('legacy-user','resource','legacy-resource')",
    );
    await database.query(
      "INSERT INTO comments(id,resource_id,user_id,rating,content) VALUES('legacy-comment','legacy-resource','legacy-user',4,'历史真实讨论')",
    );
    assert.deepEqual(
      (await migrateDatabase(database, { preview: true })).migrations,
      ["005_ai_community.sql"],
    );
    await migrateDatabase(database);
    const row = (
      await database.query("SELECT * FROM resources WHERE id='legacy-resource'")
    ).rows[0];
    assert.equal(row.scope, "legacy_review");
    assert.equal(row.featured, false);
    assert.equal(row.actual_views_count, 23);
    assert.equal(row.verified_at, null);
    assert.equal(
      (await database.query("SELECT * FROM favorites")).rows[0].target_id,
      row.id,
    );
    assert.equal(
      (await database.query("SELECT * FROM comments")).rows[0].resource_id,
      row.id,
    );
    assert.deepEqual((await migrateDatabase(database)).migrations, []);
  } finally {
    await database.close();
  }
});

test("administrators can delete topics without deleting their resources and tutorials", async () => {
  const c = await context();
  try {
    const resource = await c.service.save("resource", resourceInput, c.user);
    const article = await c.service.save("article", articleInput, c.user);
    const topic = await c.service.saveTopic(
      {
        slug: "deletion-demo",
        title: "演示专题删除测试",
        description: "验证删除专题只删除组织关系，不影响其内容。",
        status: "online",
        items: [
          { type: "resource", id: resource.item.id },
          { type: "article", id: article.item.id },
        ],
      },
      c.admin,
    );
    const userCookie = await c.login("user@example.com", "StrongPass123");
    const adminCookie = await c.login("admin@example.com", "AdminPass123");
    const path = "/api/admin/topics/" + topic.id;
    assert.equal(
      (await c.request(path, { method: "DELETE", cookie: userCookie })).response
        .status,
      403,
    );
    assert.equal(
      (await c.request(path, { method: "DELETE", cookie: adminCookie }))
        .response.status,
      204,
    );
    assert.equal(
      (await c.request("/topics/deletion-demo")).response.status,
      404,
    );
    assert.equal(
      (
        await c.database.query("SELECT * FROM topic_items WHERE topic_id=$1", [
          topic.id,
        ])
      ).rows.length,
      0,
    );
    assert.equal(
      (await c.service.detail("resource", resource.item.id)).item.id,
      resource.item.id,
    );
    assert.equal(
      (await c.service.detail("article", article.item.id)).item.id,
      article.item.id,
    );
    assert.equal(
      (
        await c.database.query(
          "SELECT * FROM audit_logs WHERE action='topic.delete' AND target_id=$1",
          [topic.id],
        )
      ).rows.length,
      1,
    );
  } finally {
    await c.close();
  }
});
