import { test, expect } from "@playwright/test";
async function login(page, admin = false) {
  await page.goto("/");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await page
    .getByLabel("邮箱", { exact: true })
    .fill(admin ? "admin@example.com" : "user@example.com");
  await page
    .getByLabel("密码", { exact: true })
    .fill(admin ? "AdminPass123" : "StrongPass123");
  await page
    .locator("#auth-form")
    .getByRole("button", { name: "登录", exact: true })
    .click();
  await expect(page.locator(".account-link")).toBeVisible();
}
for (const width of [360, 768, 1440])
  test(`publish, restore, edit and discuss at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await login(page);
    await page.goto("/submit");
    const form = page.locator("#publish-form");
    await expect(form).toBeVisible();
    const name = `AI 服装与建筑测试 ${width}`;
    await form.getByLabel("资源名称 *", { exact: true }).fill(name);
    await form
      .getByRole("combobox", { name: "主领域 *", exact: true })
      .selectOption("design");
    await form
      .getByRole("combobox", { name: "资源形态 *", exact: true })
      .selectOption("workflow");
    await form
      .getByLabel("明确的 AI 用途 *", { exact: true })
      .fill("使用 AI 将服装与建筑草图转换为可比较的视觉设计方案。");
    await form
      .getByLabel("来源或获取链接 *", { exact: true })
      .fill("https://example.com/design");
    await form.getByLabel("使用行业", { exact: true }).fill("建筑，服装");
    await page.reload();
    await expect(form.getByLabel("资源名称 *", { exact: true })).toHaveValue(
      name,
    );
    await expect(page.locator("#draft-status")).toContainText("恢复");
    await form.getByRole("button", { name: "下一步 →" }).click();
    await form
      .getByLabel("详细说明", { exact: true })
      .fill("明确输入草图、保持空间或衣物比例，通过 AI 生成模型完成视觉表达。");
    await form.getByRole("button", { name: "＋ 添加链接" }).click();
    await form
      .getByRole("combobox", { name: "链接用途", exact: true })
      .selectOption("video");
    await form.getByLabel("链接名称").fill("查看 AI 展示视频");
    await form.getByLabel("外链地址").fill("https://example.com/video");
    await form.getByRole("button", { name: "下一步 →" }).click();
    await form.locator("[name=aiConfirmed]").check();
    let failed = false;
    await page.route("**/api/resources", async (route) => {
      if (route.request().method() === "POST" && !failed) {
        failed = true;
        return route.fulfill({
          status: 503,
          json: { error: { message: "测试模拟网络暂时故障" } },
        });
      }
      return route.continue();
    });
    await form.getByRole("button", { name: "发布内容", exact: true }).click();
    await expect(form.locator(".form-error")).toContainText("网络暂时故障");
    await expect(form.locator("#publish-preview")).toContainText(name);
    await form.getByRole("button", { name: "发布内容", exact: true }).click();
    await expect(page).toHaveURL(/\/resources\/resource-/);
    await expect(page.locator("h1")).toHaveText(name);
    await expect(page.locator(".usage-verification .verification-summary")).toHaveText("尚无使用验证记录");
    const resourcePath = new URL(page.url()).pathname;
    const id = resourcePath.split("/").at(-1);
    const detail = await (
      await page.request.get("/api/resources/" + id)
    ).json();
    await expect
      .poll(
        async () =>
          (await (await page.request.get("/api/resources/" + id)).json()).item
            .views,
      )
      .toBe(1);
    await page.getByRole("button", { name: /收藏 ·/ }).click();
    await expect(
      page.getByRole("button", { name: "已收藏", exact: true }),
    ).toBeVisible();
    await page
      .locator("form[data-action=feedback]")
      .getByLabel("版本与使用环境")
      .fill("浏览器测试环境 " + width);
    await page.getByRole("button", { name: "提交 / 更新反馈" }).click();
    await expect(page.locator(".feedback-stats")).toContainText("1");
    await page.getByRole("link", { name: "编辑内容 ↗" }).click();
    await expect(form.getByLabel("资源名称 *", { exact: true })).toHaveValue(
      name,
    );
    await form.getByRole("button", { name: "02 内容与资料" }).click();
    await form.getByLabel("本次更新说明").fill("更新步骤说明以便读者复现。");
    await form
      .getByLabel("详细说明", { exact: true })
      .fill(
        "更新流程：输入图像后固定模型参数，然后执行 AI 生成流程，并检查服装材质和建筑空间比例。",
      );
    await form.getByRole("button", { name: "03 预览发布" }).click();
    await form.locator("[name=aiConfirmed]").check();
    await form.getByRole("button", { name: "保存更新" }).click();
    await expect(page.locator(".byline")).toContainText("v2");
    await page.goto("/submit?type=article");
    await expect(form).toBeVisible();
    await form
      .getByLabel("教程标题 *", { exact: true })
      .fill(`AI 设计完整实践 ${width}`);
    await form
      .getByRole("combobox", { name: "主领域 *", exact: true })
      .selectOption("video");
    await form
      .getByLabel("AI 任务目标 *", { exact: true })
      .fill("使用 AI 将角色参考图生成连续镜头，并记录测试结果。");
    await form.getByRole("button", { name: "下一步 →" }).click();
    await page
      .locator("#rich-editor")
      .fill(
        "准备一组具有明确授权来源的角色参考图，确定任务输入、输出格式和预期镜头。选择支持角色参考的 AI 视频生成模型，记录使用的模型版本及参数。完成生成之后，逐帧检查人物、服装、动作与场景的一致性，记录失败片段和改进方法，并将本次的生成步骤与结果作为可复现的实践过程。",
      );
    await form.getByRole("button", { name: "代码块", exact: true }).click();
    await page.locator("#dialog").getByLabel("语言").fill("json");
    await page
      .locator("#dialog")
      .getByLabel("代码", { exact: true })
      .fill('{"frames":24}');
    await page
      .locator("#dialog")
      .getByRole("button", { name: "插入正文" })
      .click();
    await page.locator("#resource-search").fill(name);
    await page
      .locator("#resource-results")
      .getByRole("button", { name })
      .click();
    await form.getByRole("button", { name: "下一步 →" }).click();
    await form.locator("[name=aiConfirmed]").check();
    await form.getByRole("button", { name: "发布内容", exact: true }).click();
    await expect(page).toHaveURL(/\/articles\/article-/);
    await expect(page.locator(".prose pre")).toContainText("frames");
    await expect(page.locator(".detail-main")).toContainText("依赖资源");
    await page
      .locator("form[data-action=comment]")
      .getByLabel("讨论", { exact: true })
      .fill("根据当前环境已复现，反馈清晰。");
    await page.getByRole("button", { name: "发布讨论" }).click();
    await expect(page.locator(".comment")).toContainText("反馈清晰");
    await page.goto("/profile");
    await expect(page.locator(".dashboard-list")).toContainText(name);
    await page.goto("/profile?tab=feedback");
    await expect(page.locator("#profile-content")).toContainText(
      "浏览器测试环境",
    );
    await page.goto("/resources?industry=服装");
    await expect(page.locator(".card-grid")).toContainText(name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await page.screenshot({
      path: `.tools/screenshots/ai-community-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });

test("editor verifies, features, creates an ordered topic and maintains community settings", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin");
  await expect(page.locator("#admin-content")).toContainText("浏览器测试");
  const row = page
    .locator(".dashboard-row")
    .filter({ hasText: "浏览器测试 · 建筑方案工作流" });
  await row.getByRole("button", { name: "核验", exact: true }).click();
  const dialog = page.locator("#dialog");
  await dialog
    .getByRole("combobox", { name: "核验方式", exact: true })
    .selectOption("editor_tested");
  await dialog.getByLabel("版本与环境 *").fill("浏览器验证环境 v1");
  await dialog
    .getByLabel("核验过程与证据说明 *")
    .fill("使用所列输入完成任务，核对输出满足要求，并保存本次复现说明。");
  await dialog.getByRole("button", { name: "保存核验记录" }).click();
  await expect(row.locator(".badge")).toHaveText("编辑复测");
  await row.getByRole("button", { name: "状态 / 精选" }).click();
  await dialog
    .getByLabel("处理说明 *")
    .fill("复现验证通过，纳入本期精选资源。");
  await Promise.all([
    page.waitForNavigation(),
    dialog.getByRole("button", { name: "保存处理结果" }).click(),
  ]);
  await expect(page.locator("#admin-content")).toBeVisible();
  await page.goto("/");
  await expect(
    page.locator(".section").filter({ hasText: "编辑精选" }).first(),
  ).toContainText("浏览器测试 · 建筑方案工作流");
  await page.goto("/admin?tab=topics");
  await page.getByRole("button", { name: "＋ 创建专题" }).click();
  await dialog.getByLabel("专题标题 *").fill("建筑与 AI 视频实战路径");
  await dialog.getByLabel("地址名称 *").fill("ai-test-path");
  await dialog
    .getByLabel("专题介绍 *")
    .fill("从建筑方案资源到 AI 视频任务的完整路径。");
  await dialog
    .getByRole("combobox", { name: "公开状态", exact: true })
    .selectOption("online");
  await dialog.locator("#topic-search").fill("浏览器测试");
  await dialog.locator("#topic-results").getByRole("button").first().click();
  await dialog.locator("#topic-results").getByRole("button").nth(1).click();
  await expect(dialog.locator("#topic-items li")).toHaveCount(2);
  await dialog.getByRole("button", { name: "向上移动" }).last().click();
  await dialog.getByRole("button", { name: "保存专题" }).click();
  await expect(page.locator(".dashboard-list")).toContainText(
    "建筑与 AI 视频实战路径",
  );
  await page.goto("/topics/ai-test-path");
  await expect(page.locator(".topic-item")).toHaveCount(2);
  await expect(page.locator(".topic-sequence")).toHaveText(["01", "02"]);
  await page.goto("/admin?tab=catalog");
  await page.getByLabel("标签名称").fill("数字时装");
  await page.getByRole("button", { name: "添加标签" }).click();
  await expect(page.locator(".tags")).toContainText(["数字时装"]);
  const fixture = (
    await (
      await page.request.get(
        "/api/resources?q=" + encodeURIComponent("浏览器测试 · 建筑方案工作流"),
      )
    ).json()
  ).items[0];
  await page.request.post("/api/reports", {
    data: {
      targetType: "resource",
      targetId: fixture.id,
      reportType: "链接问题",
      detail: "浏览器验证反馈处理按钮可正常保存结果。",
    },
  });
  await page.goto("/admin?tab=reports");
  await expect(page.locator("#admin-content")).toContainText(
    "浏览器验证反馈处理",
  );
  await page.getByRole("button", { name: "已核实处理" }).click();
  await expect(page.locator("#admin-content")).toContainText("暂无待处理反馈");
  await page.request.post("/api/feedback", {
    data: {
      targetType: "resource",
      targetId: fixture.id,
      revision: 1,
      outcome: "failed",
      environment: "浏览器测试反馈环境",
      content: "需要编辑补充操作条件",
    },
  });
  await page.goto("/admin?tab=feedback");
  await page.getByRole("button", { name: "记录处理" }).first().click();
  await dialog.getByLabel("处理说明 *").fill("已核对使用环境并补充必要说明。");
  await dialog.getByRole("button", { name: "保存处理" }).click();
  await expect(page.locator("#admin-content")).toContainText(
    "暂无待处理的复现问题",
  );
  await page.goto("/admin?tab=runs");
  await page.getByRole("button", { name: "立即检查到期内容与外链" }).click();
  await expect(page.locator("#run-result")).toContainText("完成");
  await page.goto("/admin?tab=checks");
  await page.getByRole("button", { name: "记录核对" }).first().click();
  await dialog
    .getByLabel("核对结果 *")
    .fill("这是访问权限限制，人工查看当前入口可以使用。");
  await dialog.getByRole("button", { name: "保存记录" }).click();
  await expect(page.locator("#admin-content")).toContainText(
    "没有待核对的链接异常",
  );
  for (const tab of [
    "review",
    "reports",
    "checks",
    "feedback",
    "users",
    "runs",
  ]) {
    await page.goto(
      "/admin?tab=" + tab + (tab === "review" ? "&queue=review" : ""),
    );
    await expect(page.locator("#admin-content")).toBeVisible();
    await expect(page.locator("#workspace")).not.toContainText("加载失败");
  }
});

test("admin can remove sample content directly from management lists", async ({
  page,
}) => {
  await login(page, true);
  const response = await page.request.post("/api/resources", {
    data: {
      name: "删除入口演示资源",
      domain: "agent",
      kind: "tool",
      aiUse: "使用 AI 协助整理资料并生成任务结果，仅用于删除入口验证。",
      website: "https://example.com",
    },
  });
  expect(response.status()).toBe(201);
  const resource = (await response.json()).item;
  const topicResponse = await page.request.post("/api/admin/topics", {
    data: {
      slug: "delete-ui-demo",
      title: "删除入口演示专题",
      description: "用于验证管理后台专题删除入口的独立数据。",
      status: "online",
      items: [{ type: "resource", id: resource.id }],
    },
  });
  expect(topicResponse.status()).toBe(200);
  await page.goto("/admin?tab=topics");
  await page
    .locator(".dashboard-row")
    .filter({ hasText: "删除入口演示专题" })
    .getByRole("button", { name: "删除", exact: true })
    .click();
  await page
    .locator("#dialog")
    .getByRole("button", { name: "确认删除", exact: true })
    .click();
  await expect(page.locator("#admin-content")).not.toContainText(
    "删除入口演示专题",
  );
  expect(
    (await page.request.get("/api/resources/" + resource.id)).status(),
  ).toBe(200);
  await page.goto("/admin?q=" + encodeURIComponent("删除入口演示资源"));
  await page
    .locator(".dashboard-row")
    .filter({ hasText: "删除入口演示资源" })
    .getByRole("button", { name: "删除", exact: true })
    .click();
  await page
    .locator("#dialog")
    .getByRole("button", { name: "确认删除", exact: true })
    .click();
  await expect(page.locator("#admin-content")).not.toContainText(
    "删除入口演示资源",
  );
  expect(
    (await page.request.get("/api/resources/" + resource.id)).status(),
  ).toBe(404);
});

test("publishing tabs preserve drafts and Bilibili videos survive editing with star discussions", async ({ page }) => {
  await page.route("https://player.bilibili.com/**", route => route.fulfill({ contentType: "text/html", body: "<p>Official player frame test</p>" }));
  await login(page);
  await page.goto("/submit?type=resource");
  const form = page.locator("#publish-form");
  await form.getByLabel("资源名称 *", { exact: true }).fill("资源 Tab 草稿测试");
  await page.getByRole("tab", { name: "实战教程", exact: true }).click();
  await expect(page).toHaveURL(/type=article/);
  await form.getByLabel("教程标题 *", { exact: true }).fill("AI 视频与星级讨论的完整测试");
  await page.getByRole("tab", { name: "AI 资源", exact: true }).click();
  await expect(form.getByLabel("资源名称 *", { exact: true })).toHaveValue("资源 Tab 草稿测试");
  await page.getByRole("tab", { name: "实战教程", exact: true }).click();
  await expect(form.getByLabel("教程标题 *", { exact: true })).toHaveValue("AI 视频与星级讨论的完整测试");
  await form.getByRole("combobox", { name: "主领域 *", exact: true }).selectOption("video");
  await form.getByLabel("AI 任务目标 *", { exact: true }).fill("通过 AI 完成角色视频生成，并通过嵌入视频展示可复现的实践成果。");
  await form.getByRole("button", { name: "下一步 →" }).click();
  const editor = page.locator("#rich-editor");
  await editor.fill("首先准备具有明确授权的角色参考图，确定视频的输入、镜头与预期效果。使用支持角色一致性的 AI 模型生成多个镜头，并记录版本、参数和失败情况。逐帧核对人物、服装和背景，选择满足任务要求的结果，再通过 B站视频展示实践过程和成果，便于其他使用者在相同条件下进行复现。");
  await editor.focus();
  await expect(editor).toHaveCSS("outline-style", "none");
  await form.getByRole("button", { name: "B站视频", exact: true }).click();
  const dialog = page.locator("#dialog");
  await dialog.getByLabel("B站视频链接或 BV 号").fill("https://www.bilibili.com/video/BV1B7411m7LV/");
  await dialog.getByLabel("视频说明（可选）").fill("角色一致性视频示例");
  await dialog.getByRole("button", { name: "插入正文" }).click();
  await expect(editor.locator(".article-video")).toHaveCount(1);
  await page.reload();
  await form.getByRole("button", { name: "02 内容与资料" }).click();
  await expect(editor.locator(".article-video")).toHaveCount(1);
  await form.getByRole("button", { name: "03 预览发布" }).click();
  await expect(page.locator("#publish-preview iframe")).toHaveAttribute("src", /player.bilibili.com.*autoplay=0/);
  await form.locator("[name=aiConfirmed]").check();
  await form.getByRole("button", { name: "发布内容", exact: true }).click();
  await expect(page).toHaveURL(/\/articles\/article-/);
  const articlePath = new URL(page.url()).pathname;
  await expect(page.locator(".detail-main iframe")).toHaveAttribute("src", /bvid=BV1B7411m7LV/);
  const response = await page.request.get(articlePath);
  expect(response.headers()["content-security-policy"]).toContain("frame-src https://player.bilibili.com");
  const commentForm = page.locator("form[data-action=comment]");
  await commentForm.locator(".rating-choice").nth(3).click();
  await expect(commentForm.getByRole("radio", { name: "4 星", exact: true })).toBeChecked();
  await commentForm.getByLabel("讨论", { exact: true }).fill("视频已完成复现，四星评分与讨论一起保存。");
  await expect(commentForm.locator("textarea")).toHaveCSS("outline-style", "none");
  await commentForm.getByRole("button", { name: "发布讨论" }).click();
  await expect(page.locator(".comment")).toContainText("四星评分");
  await expect(page.locator(".comment .rating-summary")).toHaveAttribute("aria-label", "4 星");
  const buttonBox = await page.getByRole("button", { name: "发布讨论" }).boundingBox();
  const commentBox = await page.locator(".comment").boundingBox();
  expect(commentBox.y).toBeGreaterThan(buttonBox.y + buttonBox.height);
  await page.getByRole("link", { name: "编辑内容 ↗" }).click();
  const editUrl = page.url();
  await page.getByRole("tab", { name: "AI 资源", exact: true }).click();
  await page.getByRole("tab", { name: "实战教程", exact: true }).click();
  await expect(page).toHaveURL(editUrl);
  await form.getByRole("button", { name: "02 内容与资料" }).click();
  await expect(editor.locator(".article-video")).toHaveCount(1);
  await editor.locator("[data-remove-video]").click();
  await expect(editor.locator(".article-video")).toHaveCount(0);
  await page.reload();
  await form.getByRole("button", { name: "02 内容与资料" }).click();
  await expect(editor.locator(".article-video")).toHaveCount(0);
});
