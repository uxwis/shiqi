import { api, modal, toast, submitSafely, values } from "./api.js";
import {
  escape as e,
  date,
  badge,
  pager,
  empty,
} from "../shared/presentation.js";
import { dashboardShell, bindDashboardNavigation } from "./dashboard.js";
import { contentPath } from "../shared/catalog.js";
import { field, area, failure, options, refData } from "./forms.js";
import { verification, moderation } from "./verification.js";

export async function admin(container, user, query) {
  if (user.role !== "admin") throw new Error("需要管理员权限");
  const tab = query.tab || "resources",
    data = await api(
      "/api/admin/data?" +
        new URLSearchParams({
          ...query,
          ...(tab === "review" ? { queue: "review" } : {}),
        }),
    );
  const tabs = [
    ["resources", "资源管理"],
    ["articles", "教程管理"],
    ["review", "到期复核"],
    ["topics", "专题"],
    ["reports", "失效反馈"],
    ["checks", "链接检查"],
    ["feedback", "复现问题"],
    ["users", "用户"],
    ["catalog", "分类标签"],
    ["runs", "维护任务"],
  ];
  container.innerHTML = dashboardShell({
    name: "社区管理", path: "/admin", tab, tabs, contentId: "admin-content",
    metrics: `<div class="metrics"><div><strong>${data.stats.monthViews}</strong><span>本月实际访问</span></div><div><strong>${data.reviewTotal}</strong><span>待复核内容</span></div><div><strong>${data.outboundClicks}</strong><span>资源获取点击（非完成量）</span></div></div>`,
  });
  bindDashboardNavigation(container);
  const body = container.querySelector("#admin-content");
  function contentRows(items) {
    return items.length
      ? `<div class="dashboard-list">${items.map((item) => `<article class="dashboard-row"><div><h3><a href="${contentPath(item.type, item.id)}">${e(item.title)}</a></h3><p>${badge(item)} · v${item.revision} · ${date(item.reviewDueAt)} 到期</p></div><a class="text-link" href="/submit?type=${item.type}&id=${e(item.id)}">编辑</a><button class="button secondary small" data-admin-verify ${refData(item)}>核验</button><button class="text-button" data-admin-moderate ${refData(item)}>状态 / 精选</button><button class="text-button danger" data-delete-content ${refData(item)}>删除</button></article>`).join("")}</div>`
      : empty("当前没有待处理内容", "新的投稿和维护提醒会出现在这里。");
  }
  if (["resources", "articles", "review"].includes(tab)) {
    body.innerHTML = `<form class="admin-search hero-search" method="get"><input type="hidden" name="tab" value="${e(tab)}">${tab === "review" ? '<input type="hidden" name="queue" value="review">' : ""}<input name="q" aria-label="搜索管理内容" value="${e(query.q)}" placeholder="搜索标题或 AI 用途"><button class="button">搜索</button></form><div class="section">${tab === "review" ? "<h2>资源复核</h2>" : ""}${contentRows(data[tab === "articles" ? "articles" : "resources"].items)}${pager(data[tab === "articles" ? "articles" : "resources"], "/admin", query)}</div>${tab === "review" ? "<h2>教程复核</h2>" + contentRows(data.articles.items) + pager(data.articles, "/admin", query) : ""}`;
    const items = [...data.resources.items, ...data.articles.items];
    body.querySelectorAll("[data-delete-content]").forEach(
      (button) =>
        (button.onclick = () => {
          const item = items.find(
            (item) =>
              item.type === button.dataset.type &&
              item.id === button.dataset.id,
          );
          confirmDelete(item.title, "/api" + contentPath(item.type, item.id));
        }),
    );
    body.querySelectorAll("[data-admin-verify]").forEach(
      (b) =>
        (b.onclick = () =>
          verification(
            items.find(
              (i) => i.type === b.dataset.type && i.id === b.dataset.id,
            ),
            user,
          )),
    );
    body
      .querySelectorAll("[data-admin-moderate]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            moderation(
              items.find(
                (i) => i.type === b.dataset.type && i.id === b.dataset.id,
              ),
            )),
      );
  } else if (tab === "topics") {
    const topics = await api(
      "/api/topics?manage=true&" +
        new URLSearchParams({ page: query.page || 1 }),
    );
    body.innerHTML = `<button class="button" id="create-topic">＋ 创建专题</button><div class="section dashboard-list">${topics.items.map((t) => `<article class="dashboard-row"><div><h3>${e(t.title)}</h3><p>${e(t.slug)} · ${{ draft: "草稿", online: "公开", offline: "已下架" }[t.status]}</p></div><a class="text-link" href="/topics/${e(t.slug)}">预览</a><button class="button secondary small" data-edit-topic="${e(t.slug)}">编辑与排序</button><button class="text-button danger" data-delete-topic="${e(t.id)}">删除</button></article>`).join("") || '<p class="muted">尚未创建专题。</p>'}</div>${pager(topics, "/admin", query)}`;
    body.querySelector("#create-topic").onclick = () => topicEditor();
    body.querySelectorAll("[data-delete-topic]").forEach(
      (button) =>
        (button.onclick = () => {
          const topic = topics.items.find(
            (topic) => topic.id === button.dataset.deleteTopic,
          );
          confirmDelete(
            topic.title,
            "/api/admin/topics/" + encodeURIComponent(topic.id),
          );
        }),
    );
    body.querySelectorAll("[data-edit-topic]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            await topicEditor(
              await api(
                "/api/topics/" + encodeURIComponent(b.dataset.editTopic),
              ),
            );
          } catch (error) {
            toast(error.message);
          }
        }),
    );
  } else if (tab === "reports") {
    body.innerHTML = data.reports.length
      ? `<div class="dashboard-list">${data.reports.map((r) => `<article class="dashboard-row"><div><a class="text-link" href="${contentPath(r.target_type, r.target_id)}">${e(r.report_type)} · 查看内容 ↗</a><p>${e(r.detail)}</p><small>${date(r.created_at)}</small></div><button class="button secondary small" data-report-done="${e(r.id)}" data-status="resolved">已核实处理</button><button class="text-button" data-report-done="${e(r.id)}" data-status="dismissed">无需处理</button></article>`).join("")}</div>`
      : empty("暂无待处理反馈", "用户反馈会先由编辑核对，不会自动下架。");
    body.querySelectorAll("[data-report-done]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            await api("/api/admin/reports/" + b.dataset.reportDone, {
              method: "PATCH",
              body: { status: b.dataset.status },
            });
            location.reload();
          } catch (error) {
            toast(error.message);
          }
        }),
    );
    body.insertAdjacentHTML(
      "beforeend",
      pager(data.pagination.reports, "/admin", query),
    );
  } else if (tab === "checks") {
    body.innerHTML = `<p class="field-hint">登录、限流或超时不代表资源失效。人工核对后记录处理结果；恢复链接不会自动恢复内容核验。</p><div class="dashboard-list">${data.checks.map((c) => `<article class="dashboard-row"><div><a href="${e(c.url)}" target="_blank" rel="noopener noreferrer">${e(c.url)}</a><p>${e(c.check_note)} · ${e(c.http_status || "无响应")} · ${date(c.last_checked_at)}</p><a class="text-link" href="${contentPath(c.target_type, c.target_id)}">查看关联内容</a></div><button class="button secondary small" data-check-resolve="${e(c.id)}">记录核对</button></article>`).join("") || '<p class="muted">没有待核对的链接异常。</p>'}</div>${pager(data.pagination.checks, "/admin", query)}`;
    body.querySelectorAll("[data-check-resolve]").forEach(
      (b) =>
        (b.onclick = () => {
          const d = modal(
            `<h2>记录链接人工核对</h2><form>${area("reason", "核对结果 *", "", 'required minlength="5" maxlength="1000"')}<button class="button">保存记录</button>${failure}</form>`,
          );
          d.querySelector("form").onsubmit = (ev) => {
            ev.preventDefault();
            submitSafely(ev.target, async () => {
              await api("/api/admin/links/" + b.dataset.checkResolve, {
                method: "PATCH",
                body: values(ev.target),
              });
              location.reload();
            });
          };
        }),
    );
  } else if (tab === "feedback") {
    body.innerHTML = `<div class="dashboard-list">${data.feedback.map((f) => `<article class="dashboard-row"><div><a class="text-link" href="${contentPath(f.target_type, f.target_id)}">v${f.revision} · ${f.outcome === "partial" ? "部分完成" : "无法完成"} ↗</a><p>${e(f.environment)} · ${e(f.content)}</p><small>${e(f.nickname)} · ${date(f.updated_at)}</small></div><button class="text-button" data-feedback-resolve="${e(f.id)}">记录处理</button></article>`).join("") || '<p class="muted">暂无待处理的复现问题。</p>'}</div>${pager(data.pagination.feedback, "/admin", query)}`;
    body.querySelectorAll("[data-feedback-resolve]").forEach(
      (b) =>
        (b.onclick = () => {
          const d = modal(
            `<h2>记录复现问题处理</h2><form>${area("reason", "处理说明 *", "", 'required minlength="5" maxlength="1000"')}<button class="button">保存处理</button>${failure}</form>`,
          );
          d.querySelector("form").onsubmit = (ev) => {
            ev.preventDefault();
            submitSafely(ev.target, async () => {
              await api("/api/admin/feedback/" + b.dataset.feedbackResolve, {
                method: "PATCH",
                body: values(ev.target),
              });
              location.reload();
            });
          };
        }),
    );
  } else if (tab === "users") {
    body.innerHTML = `<div class="table-scroll panel"><table><thead><tr><th>用户</th><th>邮箱</th><th>状态</th><th>操作</th></tr></thead><tbody>${data.users.map((u) => `<tr><td>${e(u.nickname)}</td><td>${e(u.email)}</td><td>${u.status === "active" ? "正常" : "已暂停"}${u.role === "admin" ? " · 管理员" : ""}</td><td>${u.role !== "admin" ? `<button class="text-button" data-user-status="${e(u.id)}" data-status="${u.status === "active" ? "banned" : "active"}">${u.status === "active" ? "暂停账号" : "恢复账号"}</button>` : "—"}</td></tr>`).join("")}</tbody></table></div>${pager(data.pagination.users, "/admin", query)}`;
    body.querySelectorAll("[data-user-status]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            await api("/api/admin/users/" + b.dataset.userStatus + "/status", {
              method: "PATCH",
              body: { status: b.dataset.status },
            });
            location.reload();
          } catch (error) {
            toast(error.message);
          }
        }),
    );
  } else if (tab === "catalog") {
    const catalog = await api("/api/catalog");
    body.innerHTML = `<div class="admin-grid"><form class="panel" id="catalog-form"><h2>补充受管理的标签</h2><label>标签类别<select name="category"><option value="industry">使用行业</option><option value="platform">模型 / 平台</option><option value="task">使用任务</option></select></label>${field("name", "标签名称", "", 'required maxlength="20"')}<button class="button">添加标签</button>${failure}</form><div class="panel"><h3>当前配置</h3>${[
      ["使用行业", catalog.industries],
      ["模型 / 平台", catalog.platforms],
      ["使用任务", catalog.tasks],
    ]
      .map(
        ([label, list]) =>
          `<h3>${label}</h3><div class="tags">${list.map((t) => `<span>${e(t)}</span>`).join("") || "<small>尚未补充</small>"}</div>`,
      )
      .join(
        "",
      )}<p>一级领域、资源形态和教程类型由系统统一维护。</p></div></div>`;
    body.querySelector("form").onsubmit = (ev) => {
      ev.preventDefault();
      submitSafely(ev.target, async () => {
        await api("/api/admin/catalog", {
          method: "POST",
          body: values(ev.target),
        });
        location.reload();
      });
    };
  } else if (tab === "runs") {
    body.innerHTML = `<div class="panel"><h2>持续维护</h2><p>自动任务：${data.maintenanceEnabled ? "已开启" : "已关闭"}。开关通过 MAINTENANCE_ENABLED 配置。未运行任务时，到期内容也会退出默认展示。</p><button class="button" id="run-maintenance">立即检查到期内容与外链</button><p id="run-result" role="status"></p></div><div class="table-scroll panel section"><table><thead><tr><th>开始</th><th>状态</th><th>检查 / 提醒</th><th>说明</th></tr></thead><tbody>${data.runs.map((r) => `<tr><td>${date(r.started_at)}</td><td>${e(r.status)}</td><td>${r.checked_count} / ${r.flagged_count}</td><td>${e(r.error)}</td></tr>`).join("")}</tbody></table></div>${pager(data.pagination.runs, "/admin", query)}`;
    body.querySelector("#run-maintenance").onclick = async (event) => {
      event.target.disabled = true;
      body.querySelector("#run-result").textContent =
        "正在检查，结果将保存到执行记录。";
      try {
        const run = await api("/api/admin/maintenance", {
          method: "POST",
          body: {},
        });
        body.querySelector("#run-result").textContent =
          run.status === "running"
            ? "已有任务正在运行。"
            : `完成：检查 ${run.checked} 个外链，新增 ${run.flagged} 项复核提醒。`;
      } catch (error) {
        toast(error.message);
      } finally {
        event.target.disabled = false;
      }
    };
  }
}

function confirmDelete(title, path) {
  const dialog = modal(
    '<h2>删除这条内容？</h2><p class="dialog-description">' +
      e(title) +
      '</p><p>删除后会从页面及管理列表移除；删除专题不会删除其中的资源或教程。</p><form><button class="button danger" type="submit">确认删除</button>' +
      failure +
      "</form>",
  );
  dialog.querySelector("form").onsubmit = (event) => {
    event.preventDefault();
    submitSafely(event.target, async () => {
      await api(path, { method: "DELETE" });
      location.reload();
    });
  };
}

async function topicEditor(topic = {}) {
  let items = [...(topic.items || [])];
  const dialog = modal(
    `<h2>${topic.id ? "编辑专题" : "创建专题"}</h2><form id="topic-form">${field("title", "专题标题 *", topic.title, 'required minlength="4" maxlength="100"')}${field("slug", "地址名称 *", topic.slug, 'required pattern="[a-z0-9][a-z0-9-]{1,79}" placeholder="ai-architecture"')}${area("description", "专题介绍 *", topic.description, 'required minlength="10" maxlength="2000"')}${field("cover", "封面外链", topic.cover, 'type="url"')}<label>公开状态<select name="status">${options(
      [
        { id: "draft", name: "草稿" },
        { id: "online", name: "公开" },
        { id: "offline", name: "下架" },
      ],
      topic.status || "draft",
    )}</select></label><label>添加资源或教程<input id="topic-search" placeholder="输入名称或任务关键词"></label><div id="topic-results"></div><ol id="topic-items"></ol><button class="button" type="submit">保存专题</button>${failure}</form>`,
  );
  const form = dialog.querySelector("form");
  const render = () => {
    form.querySelector("#topic-items").innerHTML = items
      .map(
        (i, index) =>
          `<li><span>${e(i.title)} <small>${i.type === "article" ? "教程" : "资源"}</small></span><button type="button" data-up="${index}" ${index === 0 ? "disabled" : ""} aria-label="向上移动">↑</button><button type="button" data-down="${index}" ${index === items.length - 1 ? "disabled" : ""} aria-label="向下移动">↓</button><button type="button" data-remove="${index}" aria-label="移除条目">×</button></li>`,
      )
      .join("");
  };
  render();
  form.querySelector("#topic-items").onclick = (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    const index = Number(b.dataset.up ?? b.dataset.down ?? b.dataset.remove);
    if ("remove" in b.dataset) items.splice(index, 1);
    else {
      const target = index + ("up" in b.dataset ? -1 : 1);
      [items[index], items[target]] = [items[target], items[index]];
    }
    render();
  };
  let timer,
    seq = 0;
  form.querySelector("#topic-search").oninput = (event) => {
    clearTimeout(timer);
    const token = ++seq,
      q = event.target.value;
    timer = setTimeout(async () => {
      try {
        const result = await api(
          "/api/search?q=" + encodeURIComponent(q) + "&pageSize=6",
        );
        if (token !== seq) return;
        const found = [...result.resources.items, ...result.articles.items];
        const el = form.querySelector("#topic-results");
        el.innerHTML = found
          .map(
            (i, index) =>
              `<button type="button" data-add="${index}">${e(i.title)} · ${i.type === "article" ? "教程" : "资源"}</button>`,
          )
          .join("");
        el.querySelectorAll("button").forEach(
          (b) =>
            (b.onclick = () => {
              const i = found[Number(b.dataset.add)];
              if (!items.some((v) => v.type === i.type && v.id === i.id))
                items.push(i);
              render();
            }),
        );
      } catch (error) {
        toast(error.message);
      }
    }, 250);
  };
  form.onsubmit = (event) => {
    event.preventDefault();
    submitSafely(form, async () => {
      await api(
        "/api/admin/topics" +
          (topic.id ? "/" + encodeURIComponent(topic.id) : ""),
        {
          method: topic.id ? "PATCH" : "POST",
          body: {
            ...values(form),
            items: items.map((i) => ({ type: i.type, id: i.id })),
          },
        },
      );
      location.reload();
    });
  };
}
