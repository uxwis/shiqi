import {
  DOMAINS,
  RESOURCE_KINDS,
  ARTICLE_KINDS,
  VERIFICATION_LABELS,
  contentPath,
  labelOf,
} from "./catalog.js";
export const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(value))
    : "未知";
export const badge = (item) =>
  `<span class="badge ${["editor_tested", "source_checked"].includes(item.freshness) ? "verified" : item.freshness === "review_due" ? "warning" : ""}">${escape(VERIFICATION_LABELS[item.freshness] || "尚未核验")}</span>`;
export const empty = (
  title = "这里还没有内容",
  text = "分享一个你正在使用的 AI 资源，让经验被更多人复用。",
) =>
  `<div class="empty"><span aria-hidden="true">＋</span><h3>${escape(title)}</h3><p>${escape(text)}</p><a href="/submit" class="button secondary">分享 AI 资源 ↗</a></div>`;

export const eyeIcon = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" aria-hidden=\"true\"><path d=\"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>";
export const starIcon = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9L12 3Z\"/></svg>";
export function ratingStars(rating) {
  return `<span class="rating-summary" role="img" aria-label="${Number(rating)} 星">${Array.from({ length: 5 }, (_, index) => `<span class="${index < Number(rating) ? "is-filled" : ""}">${starIcon}</span>`).join("")}</span>`;
}
export function commentCard(comment, userId) {
  return `<article class="comment"><div class="comment-heading"><strong>${escape(comment.user)}</strong><small>${date(comment.createdAt)}</small></div>${comment.rating ? ratingStars(comment.rating) : ""}<p>${escape(comment.content)}</p><div class="comment-actions"><button class="text-button" data-like="${escape(comment.id)}">赞 ${Number(comment.likes) || 0}</button>${userId === comment.userId ? `<button class="text-button" data-delete-comment="${escape(comment.id)}">删除</button>` : ""}</div></article>`;
}

export function card(item, { sequence } = {}) {
  const domain = DOMAINS.find((d) => d.id === item.domain);
  const tags = [
    labelOf(item.type === "article" ? ARTICLE_KINDS : RESOURCE_KINDS, item.kind),
    ...(item.industries || []).slice(0, 2),
    ...(item.platforms || []).slice(0, 1),
  ].filter(Boolean);
  return `<article class="card${sequence ? " topic-item" : ""}">${sequence ? `<span class="topic-sequence" aria-label="第 ${sequence} 篇">${String(sequence).padStart(2, "0")}</span>` : ""}${item.featured ? '<span class="editor-pick"><span aria-hidden="true">✧</span> 编辑精选</span>' : ""}<a class="card-cover domain-${escape(item.domain)}" href="${contentPath(item.type, item.id)}" tabindex="-1" aria-hidden="true">${item.cover ? `<img loading="lazy" src="${escape(item.cover)}" alt="">` : ""}<span class="cover-fallback"><span>${escape(domain?.icon || "◇")}</span><small>${escape(domain?.name || "AI 资源")}</small></span></a><div class="card-body"><h3><a href="${contentPath(item.type, item.id)}">${escape(item.title)}</a></h3><p>${escape(item.aiUse || item.excerpt)}</p><div class="tags">${tags.map(t => `<span>${escape(t)}</span>`).join("")}</div><div class="card-footer"><span>${escape(item.author || "社区作者")}</span><span class="view-count">${eyeIcon}${item.views || 0} 次浏览</span></div></div></article>`;
}
export const cards = (items) =>
  items.length
    ? `<div class="card-grid">${items.map((item) => card(item)).join("")}</div>`
    : empty();
export function topicMeta(topic) {
  const updatedAt = topic.updated_at || topic.updatedAt;
  return `<div class="topic-meta"><span>收录 <strong>${Number(topic.itemCount) || 0}</strong> 篇内容</span><span class="topic-views" title="专题内当前公开内容的累计浏览量">${eyeIcon}${Number(topic.totalViews) || 0} 次浏览</span><span class="topic-updated">最后更新 <time${updatedAt ? ` datetime="${escape(new Date(updatedAt).toISOString())}"` : ""}>${date(updatedAt)}</time></span></div>`;
}
export function topicCover(topic) {
  const cover = topic.cover || topic.previewCover;
  return `<div class="topic-cover">${cover ? `<img loading="lazy" src="${escape(cover)}" alt="${escape(topic.title)}专题封面">` : ""}<div class="topic-cover-fallback" aria-hidden="true"><img src="/assets/logo-mark.svg" alt="" width="48" height="48"><span>学习与实践 · 专题</span></div></div>`;
}
export function topicCard(topic) {
  return `<a class="topic-card" href="/topics/${escape(topic.slug)}">${topicCover(topic)}<div class="topic-card-body"><small>编辑策划 · 学习与实践</small><h3>${escape(topic.title)} <span aria-hidden="true">↗</span></h3><p>${escape(topic.description)}</p>${topicMeta(topic)}</div></a>`;
}
export function pager(data, path, query = {}) {
  const pages = Math.ceil(data.total / data.pageSize);
  if (pages <= 1) return "";
  const href = (page) =>
    escape(`${path}?${new URLSearchParams({ ...query, page })}`);
  return `<nav class="pagination" aria-label="分页">${data.page > 1 ? `<a class="button secondary" href="${href(data.page - 1)}">上一页</a>` : ""}<span>第 ${data.page} / ${pages} 页 · 共 ${data.total} 条</span>${data.page < pages ? `<a class="button secondary" href="${href(data.page + 1)}">下一页</a>` : ""}</nav>`;
}
export function verificationCodeButtonState(until, now = Date.now()) {
  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  return {
    disabled: remaining > 0,
    label: remaining ? `${remaining} 秒后重试` : "获取验证码",
    remaining,
  };
}
