import { test, expect } from "@playwright/test";
import { resourceInput, articleInput } from "../helpers.mjs";

const sessions = new Map();
async function signIn(page, admin = false) {
  await page.context().clearCookies();
  if (sessions.has(admin)) {
    await page.context().addCookies(sessions.get(admin));
    return;
  }
  const response = await page.request.post("/api/auth/login", {
    data: { email: admin ? "admin@example.com" : "user@example.com", password: admin ? "AdminPass123" : "StrongPass123" },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  sessions.set(admin, await page.context().cookies());
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}
async function create(page, type, data) {
  const response = await page.request.post("/api/" + (type === "article" ? "articles" : "resources"), { data });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()).item;
}

test("public cards group taxonomy and distinguish document checks from hands-on verification", async ({ page }) => {
  await signIn(page, true);
  await page.route("https://example.com/card-wide.svg", route => route.fulfill({
    contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300"><rect width="900" height="300" fill="#b9e4d0"/></svg>',
  }));
  const title = "标签与验证说明 · 超长的 AI 建筑方案设计工具标题用于检查单行省略效果";
  const resource = await create(page, "resource", { ...resourceInput, name: title, kind: "tool", coverImage: "https://example.com/card-wide.svg" });
  const article = await create(page, "article", { ...articleInput, title: "标签与验证说明 · 实战教程", resourceIds: [resource.id], platforms: ["测试平台"] });
  const path = "/resources/" + resource.id;
  await page.goto(path);
  await expect(page.locator(".verification-summary")).toHaveText("尚无使用验证记录");
  await expect(page.locator(".detail-heading .badge")).toHaveCount(0);
  for (const [method, summary] of [
    ["author_tested", "作者已实测，可查看测试环境与结果"],
    ["source_checked", "已核对来源与说明，尚未进行实际操作测试"],
    ["editor_tested", "编辑已实测，可查看复现环境与结果"],
  ]) {
    const response = await page.request.post("/api/verifications", { data: {
      targetType: "resource", targetId: resource.id, revision: 1, method,
      environment: "独立浏览器验证环境 v1", evidence: "按记录中的验证方式核对来源或实际操作，并保留具体结果说明。",
    } });
    expect(response.ok(), await response.text()).toBeTruthy();
    await page.goto(path);
    await expect(page.locator(".verification-summary")).toHaveText(summary);
    await page.locator(".verification-records summary").press("Enter");
    await expect(page.locator(".verification-records .timeline")).toContainText("独立浏览器验证环境 v1");
  }
  const featured = await page.request.post("/api/admin/resources/" + resource.id + "/moderate", { data: {
    targetType: "resource", targetId: resource.id, revision: 1, action: "feature", reason: "编辑筛选后推荐此项用于页面验证",
  } });
  expect(featured.ok(), await featured.text()).toBeTruthy();
  const topic = await page.request.post("/api/admin/topics", { data: {
    slug: "card-layout-verification", title: "卡片分类与验证路径", description: "测试专题序号、原始图片比例和精选推荐的排版。", status: "online",
    items: [{ type: "resource", id: resource.id }, { type: "article", id: article.id }],
  } });
  expect(topic.ok(), await topic.text()).toBeTruthy();
  for (const route of ["/", "/resources", "/articles", "/topics/card-layout-verification", "/articles/" + article.id]) {
    await page.goto(route);
    await expect(page.locator(".card .badge, .card .cover-kind, .card .card-top")).toHaveCount(0);
    await expect(page.locator(".card").first()).toBeVisible();
    const match = page.locator(".card").filter({ has: page.getByRole("link", { name: title, exact: true }) });
    if (await match.count()) {
      await expect(match.first().locator(".tags > span")).toHaveText(["工具与应用", "建筑", "服装", "测试平台"]);
      await expect(match.first().locator("h3")).toHaveCSS("white-space", "nowrap");
      await expect(match.first().locator(".editor-pick")).toHaveText("✧ 编辑精选");
    }
    if (route === "/articles") {
      const tutorial = page.locator(".card").filter({ hasText: article.title });
      await expect(tutorial.locator(".tags > span")).toHaveText(["操作教程", "建筑", "测试平台"]);
    }
  }
  for (const width of [1440, 1024, 768, 360]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/topics/card-layout-verification");
    const card = page.locator(".topic-item").first();
    const img = card.locator(".card-cover > img");
    await expect(img).toBeVisible();
    await img.evaluate(el => el.decode());
    const imageBox = await img.boundingBox();
    expect(imageBox.width / imageBox.height).toBeCloseTo(3, 1);
    const sequence = await card.locator(".topic-sequence").boundingBox();
    const pick = await card.locator(".editor-pick").boundingBox();
    expect(sequence.x + sequence.width).toBeLessThan(pick.x);
    expect(pick.y).toBeLessThan(imageBox.y + imageBox.height);
    await noOverflow(page);
  }
  const review = await page.request.post("/api/admin/resources/" + resource.id + "/moderate", { data: {
    targetType: "resource", targetId: resource.id, revision: 1, action: "review", reason: "使用条件变化，需要再次确认当前版本",
  } });
  expect(review.ok(), await review.text()).toBeTruthy();
  await page.goto(path);
  await expect(page.locator(".verification-summary")).toHaveText("需要重新确认，之前的验证可能不适用于当前版本");
  await expect(page.locator(".detail-main > .notice")).toContainText("需要重新确认");
  await page.locator(".verification-records summary").click();
  await expect(page.locator(".timeline")).toContainText("核对来源与说明（未实际测试）");
  await expect(page.locator(".timeline")).toContainText("编辑实际测试");
  await page.goto("/admin?q=" + encodeURIComponent(title));
  await expect(page.locator(".dashboard-row .badge")).toHaveText("待复核");
});

for (const width of [1440, 1024, 768, 360]) {
  test("profile and management navigation preserve workflows at " + width + "px", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 960 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await signIn(page);
    await create(page, "resource", { ...resourceInput, name: "侧导航回归资源 " + width });
    const profileTabs = ["resources", "articles", "favorites", "reminders", "feedback", "comments", "reports", "account"];
    const adminTabs = ["resources", "articles", "review", "topics", "reports", "checks", "feedback", "users", "catalog", "runs"];
    async function checkNav(path, tabs) {
      for (const tab of tabs) {
        await page.goto(path + "?tab=" + tab);
        const main = page.locator(".dashboard-main");
        await expect(main).toBeVisible();
        await expect(page.locator("#workspace")).not.toContainText("加载失败");
        const active = page.locator(".dashboard-nav [aria-current=page]");
        await expect(active).toHaveCount(1);
        await expect(active).toHaveAttribute("href", new RegExp("tab=" + tab));
        if (width <= 800) {
          const toggle = page.locator(".dashboard-nav-toggle");
          await expect(toggle).toHaveAttribute("aria-expanded", "false");
          await expect(active).not.toBeVisible();
          await toggle.press("Enter");
          await expect(active).toBeVisible();
          await toggle.press("Escape");
          await expect(active).not.toBeVisible();
        } else {
          const sidebar = await page.locator(".dashboard-sidebar").boundingBox();
          const content = await main.boundingBox();
          expect(sidebar.width).toBe(width > 1100 ? 215 : 190);
          expect(content.x - sidebar.x - sidebar.width).toBe(width > 1100 ? 30 : 20);
          expect(Math.abs(content.y - sidebar.y)).toBeLessThan(1);
        }
        await noOverflow(page);
      }
    }
    await checkNav("/profile", profileTabs);
    await expect(page.locator(".community-admin-entry")).toHaveCount(0);
    const nickname = await page.getByLabel("昵称", { exact: true }).inputValue();
    await page.getByLabel("个人简介").fill("侧导航账号保存验证 " + width);
    await Promise.all([page.waitForNavigation(), page.getByRole("button", { name: "保存资料" }).click()]);
    await expect(page.getByLabel("昵称", { exact: true })).toHaveValue(nickname);
    await expect(page.getByLabel("个人简介")).toHaveValue("侧导航账号保存验证 " + width);
    await page.goto("/profile?tab=resources&pageSize=1");
    await page.getByRole("link", { name: "下一页" }).click();
    await expect(page).toHaveURL(/tab=resources.*page=2/);
    await page.reload();
    await expect(page.locator(".dashboard-nav [aria-current=page]")).toHaveAttribute("href", "/profile?tab=resources");
    await page.goBack();
    await expect(page).toHaveURL(/pageSize=1$/);
    if(width <= 800) await page.locator(".dashboard-nav-toggle").click();
    await page.locator(".dashboard-nav").getByRole("link", { name: "我的教程", exact: true }).click();
    await expect(page).toHaveURL(/tab=articles$/);
    await page.goto("/admin");
    await expect(page.locator("#workspace")).toContainText("此页面仅对管理员开放");
    expect((await page.request.get("/api/admin/data")).status()).toBe(403);
    await signIn(page, true);
    await checkNav("/admin", adminTabs);
    await expect(page.locator(".dashboard-main > .metrics")).toBeVisible();
    await page.goto("/admin?tab=resources&pageSize=1");
    await page.getByRole("link", { name: "下一页" }).click();
    await expect(page).toHaveURL(/tab=resources.*page=2/);
    await page.getByRole("textbox", { name: "搜索管理内容" }).fill("侧导航回归资源 " + width);
    await page.locator(".admin-search").getByRole("button", { name: "搜索", exact: true }).click();
    await expect(page.locator(".dashboard-row")).toHaveCount(1);
    await page.locator(".dashboard-row").getByRole("button", { name: "核验", exact: true }).click();
    await expect(page.locator("#dialog")).toBeVisible();
    await page.locator("#dialog .dialog-close").click();
    await page.locator(".dashboard-row").getByRole("link", { name: "编辑", exact: true }).click();
    await expect(page.locator("#publish-form")).toBeVisible();
    await page.goto("/profile");
    if(width <= 800) await page.locator(".dashboard-nav-toggle").click();
    await expect(page.locator(".community-admin-entry")).toBeVisible();
    await page.locator(".community-admin-entry").click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/profile");
    if(width <= 800) await page.locator(".dashboard-nav-toggle").click();
    if (width === 360) {
      await page.getByRole("button", { name: "退出登录", exact: true }).click();
      await expect(page.getByRole("button", { name: "登录", exact: true })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}

