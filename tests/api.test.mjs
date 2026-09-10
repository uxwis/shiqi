import test from "node:test";
import assert from "node:assert/strict";
import { context, resourceInput, articleInput } from "./helpers.mjs";

test("registration, login, publishing, favorites, discussion and moderation use server state", async () => {
  const c = await context();
  try {
    assert.equal((await c.request("/api/health")).response.status, 200);
    await c.request("/api/auth/request-code", {
      method: "POST",
      body: { email: "new@example.com" },
    });
    assert.match(c.code, /^\d{6}$/);
    const registered = await c.request("/api/auth/register", {
      method: "POST",
      body: {
        email: "new@example.com",
        nickname: "新作者",
        password: "StrongPass123",
        code: c.code,
        agreement: true,
      },
    });
    assert.equal(registered.response.status, 201);
    const cookie = registered.cookie;
    const created = await c.request("/api/resources", {
      method: "POST",
      cookie,
      body: resourceInput,
    });
    assert.equal(created.response.status, 201, JSON.stringify(created.data));
    const item = created.data.item;
    assert.equal(item.freshness, "unverified");
    assert.equal(item.featured, false);
    const ref = { targetType: "resource", targetId: item.id };
    assert.equal(
      (
        await c.request("/api/favorites/toggle", {
          method: "POST",
          cookie,
          body: ref,
        })
      ).data.favorite,
      true,
    );
    const comment = await c.request("/api/comments", {
      method: "POST",
      cookie,
      body: { ...ref, content: "这个工作流的说明很清楚。" },
    });
    assert.equal(comment.response.status, 201);
    const cid = comment.data.comment.id;
    assert.equal(
      (
        await c.request(`/api/comments/${cid}/like`, {
          method: "POST",
          cookie,
          body: {},
        })
      ).data.added,
      true,
    );
    assert.equal(
      (
        await c.request(`/api/comments/${cid}/like`, {
          method: "POST",
          cookie,
          body: {},
        })
      ).data.added,
      false,
    );
    const upload = await c.request("/api/uploads/images", {
      method: "POST",
      cookie,
      body: { images: ["data:image/png;base64,test"] },
    });
    assert.deepEqual(upload.data.images, ["/uploads/test.png"]);
    const adminCookie = await c.login("admin@example.com", "AdminPass123");
    const blocked = await c.request(
      `/api/admin/resources/${item.id}/moderate`,
      {
        method: "POST",
        cookie: adminCookie,
        body: { action: "feature", reason: "尝试未核验精选", revision: 1 },
      },
    );
    assert.equal(blocked.response.status, 409);
    const hidden = await c.request(`/api/admin/resources/${item.id}/moderate`, {
      method: "POST",
      cookie: adminCookie,
      body: { action: "exclude", reason: "核对后确认非 AI 内容", revision: 1 },
    });
    assert.equal(hidden.response.status, 200);
    assert.equal((await c.request("/api/resources")).data.total, 0);
    assert.equal(
      (await c.request(`/api/resources/${item.id}`)).response.status,
      410,
    );
    assert.equal(
      (
        await c.request("/api/favorites/toggle", {
          method: "POST",
          cookie,
          body: ref,
        })
      ).data.favorite,
      false,
    );
  } finally {
    await c.close();
  }
});

test("authentication, ownership, origin and retired routes cannot bypass content policy", async () => {
  const c = await context();
  try {
    assert.equal(
      (
        await c.request("/api/resources", {
          method: "POST",
          body: resourceInput,
        })
      ).response.status,
      401,
    );
    const cookie = await c.login("user@example.com", "StrongPass123"),
      adminCookie = await c.login("admin@example.com", "AdminPass123");
    assert.equal(
      (await c.request("/api/admin/data", { cookie })).response.status,
      403,
    );
    assert.equal(
      (
        await c.request("/api/resources", {
          method: "POST",
          cookie,
          body: { ...resourceInput, channel: "软件工具" },
        })
      ).response.status,
      400,
    );
    assert.equal(
      (
        await c.request("/api/resources", {
          method: "POST",
          cookie,
          body: { ...resourceInput, kind: "software" },
        })
      ).response.status,
      400,
    );
    assert.equal(
      (
        await c.request("/api/resources", {
          method: "POST",
          cookie,
          body: resourceInput,
          headers: { Origin: "https://evil.example" },
        })
      ).response.status,
      403,
    );
    const created = await c.service.save("resource", resourceInput, c.admin),
      id = created.item.id;
    assert.equal(
      (
        await c.request(`/api/resources/${id}`, {
          method: "PATCH",
          cookie,
          body: { revision: 1, name: "非法改名" },
        })
      ).response.status,
      403,
    );
    assert.equal(
      (
        await c.request(`/api/admin/resources/${id}`, {
          method: "PATCH",
          cookie: adminCookie,
          body: { status: "online" },
        })
      ).response.status,
      404,
    );
    assert.equal(
      (
        await c.request("/api/submissions/old-id", {
          method: "PATCH",
          cookie,
          body: {},
        })
      ).response.status,
      404,
    );
    assert.equal((await c.request("/server/config.mjs")).response.status, 404);
    assert.equal((await c.request("/.env")).response.status, 404);
    const banned = await c.request(`/api/admin/users/${c.user.id}/status`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "banned" },
    });
    assert.equal(banned.response.status, 200);
    assert.equal(
      (await c.request("/api/me/dashboard", { cookie })).response.status,
      401,
    );
  } finally {
    await c.close();
  }
});

test("AI domains, external media, rich articles, related resources and true visits round trip", async () => {
  const c = await context();
  try {
    const cookie = await c.login("user@example.com", "StrongPass123");
    const r = await c.request("/api/resources", {
      method: "POST",
      cookie,
      body: {
        ...resourceInput,
        domain: "audio",
        industries: ["服装"],
        links: [
          {
            kind: "audio",
            label: "授权配音样例",
            url: "https://example.com/sample.mp3",
          },
        ],
        details: {
          ...resourceInput.details,
          rights: "使用本人授权声音，仅限测试展示",
        },
      },
    });
    assert.equal(r.response.status, 201, JSON.stringify(r.data));
    const a = await c.request("/api/articles", {
      method: "POST",
      cookie,
      body: {
        ...articleInput,
        domain: "video",
        resourceIds: [r.data.item.id],
        body: [
          ...articleInput.body,
          { type: "code", language: "json", text: '{"input":"sketch"}' },
          {
            type: "image",
            src: "https://example.com/result.png",
            alt: "AI 生成结果",
          },
        ],
      },
    });
    assert.equal(a.response.status, 201, JSON.stringify(a.data));
    assert.equal(a.data.relatedResources.length, 1);
    const get = await c.request(`/articles/${a.data.item.id}`);
    assert.equal(get.response.status, 200);
    assert.match(get.data, /建筑草图到 AI 方案/);
    assert.match(get.data, /data-copy-code/);
    assert.match(get.data, /noindex,follow/);
    assert.equal(
      (await c.request("/api/articles?domain=video&industry=建筑")).data.total,
      1,
    );
    assert.equal(
      (await c.request("/api/resources?industry=服装")).data.total,
      1,
    );
    await c.request(`/api/articles/${a.data.item.id}/view`, {
      method: "POST",
      body: {},
    });
    assert.equal(
      (await c.request(`/api/articles/${a.data.item.id}`)).data.item.views,
      1,
    );
    const commented = await c.request("/api/comments", {
      method: "POST",
      cookie,
      body: {
        targetType: "article",
        targetId: a.data.item.id,
        content: "按步骤复现成功",
      },
    });
    assert.equal(commented.response.status, 201);
    const body = {
      targetType: "article",
      targetId: a.data.item.id,
      revision: 1,
      outcome: "partial",
      environment: "测试环境",
      content: "缺少输入条件",
    };
    await c.request("/api/feedback", { method: "POST", cookie, body });
    await c.request("/api/feedback", {
      method: "POST",
      cookie,
      body: { ...body, outcome: "success" },
    });
    const d = await c.request(`/api/articles/${a.data.item.id}`);
    assert.deepEqual(d.data.feedback, [{ outcome: "success", count: 1 }]);
    assert.equal(d.data.comments[0].rating, null);
    const bootstrap = await c.request("/api/bootstrap");
    assert.equal(bootstrap.data.comments, undefined);
    assert.ok(bootstrap.data.home.resources.items.length <= 6);
  } finally {
    await c.close();
  }
});

test("minimal AI resources remain editable; original tutorials need no external source", async () => {
  const c = await context();
  try {
    const r = await c.service.save(
      "resource",
      {
        name: "测试 AI 入口",
        domain: "coding",
        kind: "tool",
        aiUse: "用 AI 完成应用代码生成和调试测试。",
        website: "https://example.com",
      },
      c.user,
    );
    assert.equal(r.item.revision, 1);
    const updated = await c.service.save(
      "resource",
      { revision: 1, name: "更新后的 AI 入口" },
      c.user,
      r.item.id,
    );
    assert.equal(updated.item.revision, 1);
    const original = await c.service.save("article", articleInput, c.user);
    assert.equal(original.links.length, 0);
    await assert.rejects(
      c.service.save(
        "article",
        { ...articleInput, details: { origin: "repost" } },
        c.user,
      ),
      /来源/,
    );
    const cookie = await c.login("user@example.com", "StrongPass123");
    const dashboard = await c.request("/api/me/dashboard", { cookie });
    assert.equal(
      dashboard.response.status,
      200,
      JSON.stringify(dashboard.data),
    );
    assert.equal(dashboard.data.resources.total, 1);
    assert.equal(dashboard.data.articles.total, 1);
    const adminCookie = await c.login("admin@example.com", "AdminPass123");
    const admin = await c.request("/api/admin/data", { cookie: adminCookie });
    assert.equal(admin.response.status, 200, JSON.stringify(admin.data));
  } finally {
    await c.close();
  }
});

test("analytics follow Shanghai day boundaries and ignore legacy demo counts", async () => {
  let now = new Date("2026-01-31T15:59:59Z");
  const c = await context({ now: () => now });
  try {
    const { item } = await c.service.save("resource", resourceInput, c.user);
    await c.database.query(
      "UPDATE resources SET views_count=9999,rating=5,ratings_count=100,favorites_count=99 WHERE id=$1",
      [item.id],
    );
    await c.repository.incrementView("resource", item.id);
    now = new Date("2026-01-31T16:00:01Z");
    await c.repository.incrementView("resource", item.id);
    const rows = (
      await c.database.query("SELECT * FROM content_view_daily ORDER BY day")
    ).rows;
    assert.equal(rows.length, 2);
    assert.equal(Number(rows[0].resource_views), 1);
    const d = await c.service.detail("resource", item.id);
    assert.equal(d.item.views, 2);
    assert.equal(d.item.favorites, 0);
    assert.equal(d.item.rating, null);
  } finally {
    await c.close();
  }
});

test("uploaded covers persist and cosmetic edits never refresh verification timestamps", async () => {
  const c = await context();
  try {
    const { item } = await c.service.save(
      "resource",
      { ...resourceInput, coverImage: "/uploads/test.png" },
      c.user,
    );
    await c.service.verify(
      { type: "resource", id: item.id },
      {
        revision: 1,
        method: "editor_tested",
        environment: "测试环境 v1",
        evidence: "使用指定输入在当前环境完成了可重复的测试。",
      },
      c.admin,
    );
    const before = await c.service.detail("resource", item.id);
    const after = await c.service.save(
      "resource",
      {
        revision: 1,
        tags: ["新标签"],
        coverImage: "https://example.com/new-cover.png",
      },
      c.user,
      item.id,
    );
    assert.equal(after.item.revision, 1);
    assert.equal(after.item.verifiedAt, before.item.verifiedAt);
    assert.equal(after.item.cover, "https://example.com/new-cover.png");
    await assert.rejects(
      c.service.save(
        "resource",
        { revision: 1, coverImage: "/uploads/../private.png" },
        c.user,
        item.id,
      ),
      /图片/,
    );
  } finally {
    await c.close();
  }
});
