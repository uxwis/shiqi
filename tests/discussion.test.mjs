import test from "node:test";
import assert from "node:assert/strict";
import { context, resourceInput, articleInput } from "./helpers.mjs";
import { createCommunityService } from "../server/community-service.mjs";

for (const [type, input] of [["resource", resourceInput], ["article", articleInput]]) {
  test(`${type} discussion optionally saves a reproduction result without an environment`, async () => {
    const c = await context();
    try {
      const { item } = await c.service.save(type, input, c.user);
      const cookie = await c.login("user@example.com", "StrongPass123");
      const submit = (body) => c.request("/api/comments", {
        method: "POST", cookie,
        body: { targetType: type, targetId: item.id, ...body },
      });
      const plain = await submit({ content: "想了解更多使用经验", outcome: "" });
      assert.equal(plain.response.status, 201);
      let detail = await c.service.detail(type, item.id);
      assert.equal(detail.comments[0].outcome, null);
      assert.equal(detail.comments[0].rating, null);
      assert.deepEqual(detail.feedback, []);

      const result = await submit({ content: "已经完成复现，输出符合预期。", revision: 1, outcome: "success", rating: 4 });
      assert.equal(result.response.status, 201);
      detail = await c.service.detail(type, item.id);
      const saved = detail.comments.find(comment => comment.id === result.data.comment.id);
      assert.equal(saved.outcome, "success");
      assert.equal(saved.revision, 1);
      assert.equal(saved.rating, 4);
      assert.deepEqual(detail.feedback.map(f => [f.outcome, Number(f.count)]), [["success", 1]]);
      const feedback = (await c.database.query("SELECT * FROM reproduction_feedback WHERE target_type=$1 AND target_id=$2", [type, item.id])).rows[0];
      assert.equal(feedback.environment, "");
      assert.equal(feedback.content, saved.content);

      assert.equal((await submit({ content: "补充：复杂输入只能完成一部分。", revision: 1, outcome: "partial" })).response.status, 201);
      detail = await c.service.detail(type, item.id);
      assert.deepEqual(detail.feedback.map(f => [f.outcome, Number(f.count)]), [["partial", 1]]);
      assert.equal(detail.comments.find(comment => comment.id === saved.id).outcome, "success");
      assert.equal((await submit({ content: "其他步骤也有参考价值。" })).response.status, 201);
      assert.deepEqual((await c.service.detail(type, item.id)).feedback.map(f => [f.outcome, Number(f.count)]), [["partial", 1]]);

      const page = await c.request(`/${type === "article" ? "articles" : "resources"}/${item.id}`);
      assert.match(page.data, /讨论与反馈/);
      assert.match(page.data, /复现成功 · v1/);
      assert.doesNotMatch(page.data, /data-action="feedback"/);
      const listed = await c.request(`/api/${type === "article" ? "articles" : "resources"}/${item.id}/comments`);
      assert.equal(listed.data.items.find(comment => comment.id === saved.id).outcome, "success");

      await c.service.save(type, { revision: 1, details: { version: "test-v2", updateNote: "更新适用模型版本" } }, c.user, item.id);
      detail = await c.service.detail(type, item.id);
      assert.deepEqual(detail.feedback, []);
      assert.equal(detail.comments.find(comment => comment.id === saved.id).revision, 1);
      assert.equal((await submit({ content: "旧页面上的复现结果。", revision: 1, outcome: "success" })).response.status, 409);
      assert.equal((await c.service.detail(type, item.id)).comments.length, 4);
    } finally {
      await c.close();
    }
  });
}

test("invalid combined submissions write neither comments nor reproduction feedback", async () => {
  const c = await context();
  try {
    const { item } = await c.service.save("resource", resourceInput, c.user);
    const ref = { type: "resource", id: item.id };
    for (const body of [
      { content: "有效的内容", outcome: "invalid", revision: 1 },
      { content: "有效的内容", outcome: "success", revision: 0 },
      { content: "有效的内容", outcome: "success" },
      { content: " ", outcome: "success", revision: 1 },
      { content: "有效的内容", outcome: "success", revision: 1, rating: 6 },
    ]) await assert.rejects(c.service.comment(ref, body, c.user));
    assert.equal((await c.database.query("SELECT * FROM comments")).rows.length, 0);
    assert.equal((await c.database.query("SELECT * FROM reproduction_feedback")).rows.length, 0);
  } finally {
    await c.close();
  }
});

test("combined submission rolls back feedback when saving its comment fails", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const c = await context();
  try {
    const { item } = await c.service.save("resource", resourceInput, c.user);
    const service = createCommunityService({
      ...c.database,
      transaction: (callback) => c.database.transaction(client => callback({
        query: (sql, args) => {
          if (sql.startsWith("INSERT INTO comments")) throw new Error("Simulated comment storage failure");
          return client.query(sql, args);
        },
      })),
    });
    await assert.rejects(service.comment({ type: "resource", id: item.id }, {
      content: "复现成功，测试事务回滚。", outcome: "success", revision: 1,
    }, c.user), /Simulated comment storage failure/);
    assert.equal((await c.database.query("SELECT * FROM reproduction_feedback")).rows.length, 0);
    assert.equal((await c.database.query("SELECT * FROM comments")).rows.length, 0);
  } finally {
    await c.close();
  }
});
