import { api, submitSafely, values, toast } from "./api.js";
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
export async function profile(container, user, query) {
  const data = await api("/api/me/dashboard?" + new URLSearchParams(query)),
    tab = query.tab || "resources";
  const tabs = [
    ["resources", "我的资源"],
    ["articles", "我的教程"],
    ["favorites", "收藏"],
    ["reminders", "待复核"],
    ["feedback", "复现反馈"],
    ["comments", "我的讨论"],
    ["reports", "问题反馈"],
    ["account", "账号资料"],
  ];
  const row = (item) =>
    `<article class="dashboard-row"><div><h3><a href="${contentPath(item.type, item.id)}">${e(item.title)}</a></h3><p>${badge(item)} · ${date(item.updatedAt || item.createdAt)}${item.revision ? " · v" + item.revision : ""}</p></div>${tab === "favorites" ? `<button class="text-button" data-remove-favorite ${refData(item)}>取消收藏</button>` : `<a class="button secondary small" href="/submit?type=${item.type}&id=${e(item.id)}">编辑</a>`}</article>`;
  const rows = (items) =>
    items.length
      ? `<div class="dashboard-list">${items.map(row).join("")}</div>`
      : empty("这里还没有记录");
  const adminEntry = user.role === "admin" ? '<a class="community-admin-entry" href="/admin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></svg><span>社区管理</span><small>管理员</small><span aria-hidden="true">↗</span></a>' : "";
  container.innerHTML = dashboardShell({
    name: "个人中心", path: "/profile", tab, tabs, contentId: "profile-content",
    counts: { reminders: data.reminderTotal },
    footer: adminEntry + '<button class="text-button dashboard-logout" id="logout">退出登录</button>',
  });
  bindDashboardNavigation(container);
  const body = container.querySelector("#profile-content");
  if (["resources", "articles"].includes(tab))
    body.innerHTML =
      rows(data[tab].items) + pager(data[tab], "/profile", query);
  else if (tab === "favorites")
    body.innerHTML =
      rows(data.favorites) +
      pager(data.pagination.favorites, "/profile", query);
  else if (tab === "reminders")
    body.innerHTML =
      `<p class="field-hint">到期、依赖变化或问题反馈确认后需要重新核对的内容。</p>` +
      rows(data.reminders) +
      pager(data.pagination.reminders, "/profile", query);
  else if (tab === "account") {
    body.innerHTML = `<form id="profile-form" class="panel">${field("nickname", "昵称", user.nickname, 'required minlength="2" maxlength="20"')}${area("bio", "个人简介", user.bio, 'maxlength="120"')}<div class="form-grid"><label>性别<select name="gender">${options(["不公开", "女", "男", "其他"], user.gender)}</select></label>${field("birthday", "生日", user.birthday, 'type="date"')}</div><p class="field-hint">邮箱：${e(user.email)} · <a href="/creators/${e(user.id)}">查看公开作者页 ↗</a></p><button class="button" type="submit">保存资料</button>${failure}</form>`;
    body.querySelector("form").onsubmit = (event) => {
      event.preventDefault();
      submitSafely(event.target, async () => {
        await api("/api/me/profile", {
          method: "PATCH",
          body: values(event.target),
        });
        toast("资料已保存");
        location.reload();
      });
    };
  } else if (["feedback", "comments", "reports"].includes(tab)) {
    const items = data[tab];
    body.innerHTML = items.length
      ? `<div class="dashboard-list">${items.map((i) => `<article class="dashboard-row"><div><a href="${contentPath(i.target_type || (i.article_id ? "article" : "resource"), i.target_id || i.article_id || i.resource_id)}">查看关联内容 ↗</a><p>${e(i.content || i.detail || "")} ${i.outcome ? " · " + { success: "成功", partial: "部分完成", failed: "无法完成" }[i.outcome] + " · v" + i.revision : ""}${i.status ? " · " + ({ pending: "待处理", resolved: "已处理", dismissed: "已核对" }[i.status] || i.status) : ""}</p><small>${date(i.updated_at || i.created_at)} ${e(i.environment || "")}</small></div></article>`).join("")}</div>`
      : empty("还没有反馈记录");
    body.innerHTML += pager(data.pagination[tab], "/profile", query);
  } else body.innerHTML = empty("此栏目不存在");
  container.querySelector("#logout").onclick = async () => {
    await api("/api/auth/logout", { method: "POST", body: {} });
    location.href = "/";
  };
  container.querySelectorAll("[data-remove-favorite]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await api("/api/favorites/toggle", {
            method: "POST",
            body: { targetType: b.dataset.type, targetId: b.dataset.id },
          });
          b.closest(".dashboard-row").remove();
          toast("已取消收藏");
        } catch (error) {
          toast(error.message);
        }
      }),
  );
}
