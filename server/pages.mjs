import { config } from "./config.mjs";
import {
  DOMAINS,
  RESOURCE_KINDS,
  ARTICLE_KINDS,
  LINK_KINDS,
  VERIFICATION_LABELS,
  contentPath,
  labelOf,
} from "../shared/catalog.js";
import {
  escape as e,
  date,
  empty,
  cards,
  card,
  topicCard,
  topicCover,
  topicMeta,
  commentCard,
  starIcon,
  pager,
} from "../shared/presentation.js";
import { renderRichBlock } from "../rich-text.js";

const intro = (eyebrow, title, description, action = "") =>
  `<div class="page-intro"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
const section = (title, description, body, href = "") =>
  `<section class="section"><div class="section-heading"><div><h2>${title}</h2>${description ? `<p>${description}</p>` : ""}</div>${href ? `<a class="text-link" href="${href}">查看全部 ↗</a>` : ""}</div>${body}</section>`;
const options = (items, value, all = "全部") =>
  `<option value="">${all}</option>` +
  items
    .map(
      (i) =>
        `<option value="${e(i.id || i)}" ${(i.id || i) === value ? "selected" : ""}>${e(i.name || i)}</option>`,
    )
    .join("");
function filters(type, catalog, query) {
  return `<form class="filter-panel" method="get" action="/${type === "article" ? "articles" : "resources"}"><div class="filter-title">筛选内容 <a href="/${type === "article" ? "articles" : "resources"}">重置</a></div><label>关键词<input name="q" placeholder="搜索用途、名称、任务" value="${e(query.q)}"></label><label>应用领域<select name="domain">${options(DOMAINS, query.domain)}</select></label><label>${type === "article" ? "教程类型" : "资源形态"}<select name="kind">${options(type === "article" ? ARTICLE_KINDS : RESOURCE_KINDS, query.kind)}</select></label><label>使用行业<select name="industry">${options(catalog.industries, query.industry)}</select></label><label>平台<select name="platform">${options(catalog.platforms, query.platform)}</select></label><label>排序<select name="sort">${options(
    [
      { id: "new", name: "最新发布" },
      { id: "verified", name: "最近核验" },
      { id: "popular", name: "真实热度" },
      { id: "updated", name: "实质更新" },
    ],
    query.sort,
    "默认排序",
  )}</select></label><button class="button" type="submit">应用筛选</button><p class="muted">列表自动排除到期、待复核和已失效的内容。</p></form>`;
}
function linksHTML(links, item) {
  return links
    .map(
      (l) =>
        `<a class="resource-link" data-outbound="${e(l.id)}" data-type="${item.type}" data-id="${e(item.id)}" href="${e(l.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${e(l.label || labelOf(LINK_KINDS, l.kind))}</strong><small>${e(new URL(l.url).hostname)}</small></span><span>↗</span></a>`,
    )
    .join("");
}
const usageVerificationLabels = {
  unverified: "尚无使用验证记录",
  source_checked: "已核对来源与说明，尚未进行实际操作测试",
  author_tested: "作者已实测，可查看测试环境与结果",
  editor_tested: "编辑已实测，可查看复现环境与结果",
  review_due: "需要重新确认，之前的验证可能不适用于当前版本",
  broken: "此内容已失效或下架",
  excluded: "此内容不在 AI 资源收录范围内",
  legacy_review: "此内容的收录范围与使用信息尚待确认",
};
const verificationMethodLabels = {
  source_checked: "核对来源与说明（未实际测试）",
  author_tested: "作者实际测试",
  editor_tested: "编辑实际测试",
};
function usageVerificationHTML(item, verifications, revisions) {
  const records = verifications.map(v => `<div><span class="timeline-dot"></span><strong>${e(verificationMethodLabels[v.method] || "使用验证")} · v${v.revision}</strong><small>${date(v.created_at)} · ${e(v.actor_name)}</small><p>环境：${e(v.environment)}</p><p>${e(v.evidence)}</p></div>`).join("") +
    revisions.map(r => `<div><span class="timeline-dot"></span><strong>内容修订 v${r.revision}</strong><small>${date(r.created_at)}</small><p>${e(r.summary)}</p></div>`).join("");
  return `<section class="usage-verification" id="usage-verification" aria-labelledby="usage-verification-heading"><h2 id="usage-verification-heading">使用验证</h2><p class="verification-summary${item.freshness === "review_due" ? " needs-review" : ""}">${e(usageVerificationLabels[item.freshness] || usageVerificationLabels.unverified)}</p><dl><div><dt>适用内容版本</dt><dd>v${item.revision}</dd></div><div><dt>最近验证</dt><dd>${item.verifiedAt ? date(item.verifiedAt) : "暂无当前版本记录"}</dd></div><div><dt>下次确认</dt><dd>${item.reviewDueAt ? date(item.reviewDueAt) : "尚未安排"}</dd></div></dl><details class="verification-records"><summary>查看验证环境与修订记录</summary><div class="timeline">${records || '<p class="muted">尚无验证或修订记录。</p>'}</div></details></section>`;
}
function detailHTML(data, user) {
  const {
    item: i,
    links,
    verifications,
    revisions,
    comments,
    feedback,
    relatedResources,
    relatedArticles,
  } = data;
  const owner = user && (user.id === i.userId || user.role === "admin");
  const ref = `data-type="${i.type}" data-id="${e(i.id)}" data-revision="${i.revision}"`;
  const detailLabels = {
    version: "适用版本",
    requirements: "依赖与环境",
    cost: "费用与额度",
    inputs: "任务输入",
    steps: "使用步骤",
    output: "成果与效果",
    limitations: "使用限制",
    rights: "声音 / 形象的来源与使用范围",
  };
  const discussion = `<div class="discussion"><form class="discussion-form" data-action="comment" ${ref}><fieldset class="star-rating" data-star-rating><legend>评分（可选）</legend><div class="rating-controls"><div class="rating-options">${[1, 2, 3, 4, 5].map((rating) => `<label class="rating-choice"><input type="radio" name="rating" value="${rating}" aria-label="${rating} 星">${starIcon}</label>`).join("")}</div><span class="rating-label" data-rating-label aria-live="polite">点击星星评分</span><button class="text-button" type="button" data-clear-rating hidden>清除评分</button></div></fieldset><label>讨论<textarea name="content" required minlength="2" maxlength="2000" placeholder="具体的环境、遇到的问题或改进建议"></textarea></label><button class="button" type="submit">发布讨论</button><p class="form-error" role="alert"></p></form><div class="discussion-list">${comments.length ? comments.map((c) => commentCard(c, user?.id)).join("") : '<p class="discussion-empty muted">还没有讨论，欢迎留下你的使用经验。</p>'}<button class="text-button" data-more-comments ${ref} data-page="2" ${comments.length < 20 ? "hidden" : ""}>加载更多讨论</button></div></div>`;
  return `<nav class="breadcrumb"><a href="/${i.type === "article" ? "articles" : "resources"}">${i.type === "article" ? "实战教程" : "资源库"}</a><span>/</span>${e(labelOf(DOMAINS, i.domain))}</nav><div class="detail-layout"><article class="detail-main"><div class="detail-heading"><div class="tags"><span>${e(labelOf(i.type === "article" ? ARTICLE_KINDS : RESOURCE_KINDS, i.kind))}</span></div><h1>${e(i.title)}</h1><p class="lead">${e(i.aiUse)}</p><div class="byline"><a href="/creators/${e(i.userId || "unknown")}">${e(i.author)}</a><span>发布于 ${date(i.createdAt)}</span><span>${i.views} 次浏览</span>${i.ratings ? `<span>${i.rating.toFixed(1)} 分 · ${i.ratings} 人评分</span>` : ""}<span>修订 v${i.revision}</span></div>${owner ? `<a class="text-link" href="/submit?type=${i.type}&id=${e(i.id)}">编辑内容 ↗</a>` : ""}</div>${i.freshness === "review_due" ? '<div class="notice">需要重新确认：之前的验证可能不适用于当前版本，请先查看使用条件与历史记录。</div>' : ""}${["broken", "excluded", "legacy_review"].includes(i.freshness) ? '<div class="notice">此内容未公开。完成范围确认和核验后方可恢复展示。</div>' : ""}${usageVerificationHTML(i, verifications, revisions)}${i.cover ? `<div class="detail-cover"><img src="${e(i.cover)}" alt="${e(i.title)}的成果封面"></div>` : ""}<div class="prose">${i.type === "article" ? i.body.map(renderRichBlock).join("") : `<h2>这个资源能做什么</h2><p>${e(i.description).replace(/\n/g, "<br>")}</p>`}${Object.entries(
    detailLabels,
  )
    .filter(([k]) => i.details[k])
    .map(
      ([k, label]) =>
        `<h2>${label}</h2><p>${e(i.details[k]).replace(/\n/g, "<br>")}</p>`,
    )
    .join(
      "",
    )}${i.images.map((src) => `<img loading="lazy" src="${e(src)}" alt="教程配图">`).join("")}</div>${relatedResources.length ? section("依赖资源", "按任务流程搭配使用", cards(relatedResources)) : ""}${relatedArticles.length ? section("相关实战教程", "把资源应用到具体任务", cards(relatedArticles)) : ""}<section class="section"><h2>复现反馈 <small>当前 v${i.revision}</small></h2><div class="feedback-stats">${[
    ["success", "成功"],
    ["partial", "部分完成"],
    ["failed", "无法完成"],
  ]
    .map(
      ([key, label]) =>
        `<span><strong>${feedback.find((f) => f.outcome === key)?.count || 0}</strong>${label}</span>`,
    )
    .join(
      "",
    )}</div><form data-action="feedback" ${ref}><div class="form-grid"><label>复现结果<select name="outcome"><option value="success">成功</option><option value="partial">部分完成</option><option value="failed">无法完成</option></select></label><label>版本与使用环境<input name="environment" required minlength="2" placeholder="模型版本、设备、依赖等"></label></div><label>反馈说明<textarea name="content" placeholder="描述复现过程中的发现"></textarea></label><button class="button secondary">提交 / 更新反馈</button><p class="form-error" role="alert"></p></form></section>${section("讨论", "评分可选，欢迎具体、可复现的经验。", discussion)}</article><aside class="detail-sidebar"><div class="panel"><span class="eyebrow">${i.type === "article" ? "配套资料" : "获取与使用"}</span><h2>${i.type === "article" ? "从这里开始实践" : "让好资源用起来"}</h2>${linksHTML(links, i) || '<p class="muted">原创教程，无需站外资料。</p>'}<button class="button secondary full" data-favorite ${ref}>收藏 · ${i.favorites}</button><button class="text-button full" data-report ${ref}>反馈失效或内容问题</button></div><div class="panel"><h3>当前使用条件</h3><dl><dt>原始发布时间</dt><dd>${date(i.originalPublishedAt)}</dd><dt>实质更新</dt><dd>${date(i.updatedAt)}</dd></dl><a class="text-link verification-jump" href="#usage-verification">查看使用验证与记录 ↓</a><div class="tags">${[...i.industries, ...i.platforms, ...i.tags].map((t) => `<span>${e(t)}</span>`).join("")}</div></div>${owner ? `<div class="panel"><h3>维护此内容</h3><button class="button secondary full" data-verify ${ref}>${user.role === "admin" ? "记录核验" : "提交作者自测"}</button>${user.role === "admin" ? `<button class="text-button full" data-moderate ${ref}>精选与内容状态</button>` : ""}</div>` : ""}</aside></div>`;
}
export function layout({
  title,
  description = "发现、分享与复用优质 AI 资源与实战方案。",
  body,
  path = "/",
  user = null,
  noindex = false,
  cover = "",
  data = {},
}) {
  const canonical = config.appOrigin + path;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f7f7"><title>${e(title)} · 拾器</title><meta name="description" content="${e(description)}"><meta name="robots" content="${noindex ? "noindex,follow" : "index,follow"}"><link rel="canonical" href="${e(canonical)}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(canonical)}">${cover ? `<meta property="og:image" content="${e(new URL(cover, config.appOrigin).href)}">` : ""}<link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/styles.css"><script type="module" src="/app.js"></script></head><body><a class="skip-link" href="#main">跳到主要内容</a><header class="site-header"><div class="header-inner"><a href="/" class="brand" aria-label="拾器首页"><img src="/assets/logo.svg" alt="拾器" width="85" height="30"></a><nav class="main-nav" aria-label="主导航">${[
    ["/", "首页"],
    ["/resources", "资源库"],
    ["/articles", "实战库"],
    ["/topics", "专题"],
    ["/updates", "最近更新"],
  ]
    .map(
      ([href, text]) =>
        `<a ${(href === "/" ? path === "/" : path === href || path.startsWith(href + "/")) ? 'aria-current="page"' : ""} href="${href}">${text}</a>`,
    )
    .join(
      "",
    )}</nav><div class="header-actions"><a class="icon-button" href="/search" aria-label="搜索">⌕</a>${user ? `<a class="account-link" href="/profile">${e(user.nickname)}</a>` : '<button class="text-button" data-login>登录</button>'}<a href="/submit" class="button small">＋ 发布</a></div></div></header><main id="main" class="container">${body}</main><footer class="site-footer container"><a href="/" class="footer-brand"><img src="/assets/logo.svg" alt="拾器" width="85" height="30"><span>AI资源库，让 AI 真正用起来。</span></a><p class="footer-copyright">Copyright © 2026 WIS All rights reserved.</p><div class="footer-links"><a href="/privacy">隐私与使用约定</a><a href="/submit">参与共建 ↗</a></div></footer><dialog id="dialog"><button class="dialog-close" aria-label="关闭对话框">×</button><div id="dialog-body"></div></dialog><div id="toast" role="status" aria-live="polite"></div><script id="page-data" type="application/json">${JSON.stringify({ user, ...data }).replace(/</g, "\\u003c")}</script></body></html>`;
}
export async function renderPage(url, service, user) {
  const path = url.pathname,
    query = Object.fromEntries(url.searchParams);
  let body,
    title,
    description,
    cover = "",
    noindex = false,
    data = {};
  if (path === "/") {
    const h = await service.home();
    title = "发现值得复用的 AI 资源";
    body = `<section class="home-hero"><div><span class="eyebrow"><i></i> 发现 · 实践 · 共建</span><h1>找到好资源，<br>让 <span>AI</span> 真正用起来。</h1><p>从灵感到成果，发现可复用的工具、工作流与实战经验。</p><form class="hero-search" action="/search"><svg class="hero-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input name="q" aria-label="搜索 AI 资源" placeholder="想用 AI 完成什么？"><button class="button" type="submit">搜索 <span aria-hidden="true">↗</span></button></form><div class="search-hints"><span>从一个任务开始</span><a href="/resources?industry=建筑">建筑方案</a><a href="/resources?industry=服装">服装设计</a><a href="/resources?domain=agent">Agent 工作流</a></div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="art-note">IDEAS INTO PRACTICE</span><div class="art-tile tile-a">⌘<small>连接工具</small></div><div class="art-tile tile-b">◇<small>创造可能</small></div><div class="art-center"><img src="/assets/logo-mark.svg" alt="" width="56" height="56"></div><div class="art-tile tile-c">↗<small>复用经验</small></div><span class="art-bottom">A curated space for AI.</span></div></section><div class="domain-grid">${DOMAINS.map((d) => `<a href="/resources?domain=${d.id}"><span class="domain-icon${d.iconSrc ? "" : " is-placeholder"}" data-domain-icon="${d.id}" aria-hidden="true">${d.iconSrc ? `<img src="${e(d.iconSrc)}" alt="" width="36" height="36">` : ""}</span><div><strong>${e(d.name)}</strong><small>${e(d.description)}</small></div><b>↗</b></a>`).join("")}</div>`;
    if (h.featured.items.length)
      body += section(
        "编辑精选",
        "有依据的推荐，验证依据可在详情页查看。",
        cards(h.featured.items),
        "/resources?featured=true",
      );
    body += section(
      "社区新分享",
      "新的发现，来自正在实践的人。",
      cards(h.resources.items),
      "/resources",
    );
    if (h.verified.items.length)
      body += section(
        "近期核验",
        "持续核对，才能放心复用。",
        cards(h.verified.items),
        "/resources?sort=verified&verified=true",
      );
    if (h.articles.items.length)
      body += section(
        "把资源用成成果",
        "从任务、过程到结果，一起看懂怎样完成。",
        cards(h.articles.items),
        "/articles",
      );
    if (h.topics.items.length)
      body += section(
        "沿着专题，深入实践",
        "围绕一个目标，连接资源和经验。",
        `<div class="topic-grid">${h.topics.items.map(topicCard).join("")}</div>`,
        "/topics",
      );
    body += `<section class="contribute-banner"><div><span class="eyebrow">BUILT BY THE COMMUNITY</span><h2>你的实践，也能成为他人的起点。</h2><p>分享正在使用的 AI 资源，记录具体用途、成果与使用条件。</p></div><a class="button" href="/submit">分享我的发现 ↗</a></section>`;
  } else if (["/resources", "/articles"].includes(path)) {
    const type = path === "/articles" ? "article" : "resource";
    title = type === "article" ? "实战教程" : "AI 资源库";
    const [list, catalog] = await Promise.all([
      service.list(type, query),
      service.catalog(),
    ]);
    body =
      intro(
        type === "article" ? "LEARN BY DOING" : "THE AI COLLECTION",
        title,
        type === "article"
          ? "记录任务、过程与成果，让经验可以复现。"
          : "跨越行业，发现适合当前任务的 AI 资源。",
      ) +
      `<div class="listing-layout">${filters(type, catalog, query)}<div><div class="results-heading"><span>找到 <strong>${list.total}</strong> 条${type === "article" ? "实战教程" : "资源"}</span><span>持续更新 · 当前可用范围</span></div>${cards(list.items)}${pager(list, path, query)}</div></div>`;
  } else if (/^\/(resources|articles)\/[^/]+$/.test(path)) {
    const [, group, id] = path.split("/");
    const type = group === "articles" ? "article" : "resource";
    const result = await service.detail(type, decodeURIComponent(id), user);
    const i = result.item;
    title = i.title;
    description = i.aiUse;
    cover = i.cover;
    body = detailHTML(result, user);
    noindex = !["source_checked", "author_tested", "editor_tested"].includes(
      i.freshness,
    );
    data = {
      detail: {
        type,
        id: i.id,
        revision: i.revision,
        public: i.scope === "ai" && i.status === "online",
      },
    };
  } else if (path === "/topics") {
    title = "专题";
    const list = await service.topics(query);
    body =
      intro(
        "CURATED PATHS",
        "围绕任务，串联好资源。",
        "从入门路径到完整任务，用专题连接知识与实践。",
      ) +
      (list.items.length
        ? `<div class="topic-grid">${list.items.map(topicCard).join("")}</div>`
        : empty(
            "专题正在准备中",
            "编辑会将经过核验的资源与实战教程组织成完整路径。",
          )) +
      pager(list, path, query);
  } else if (path.startsWith("/topics/")) {
    const topic = await service.topic(decodeURIComponent(path.slice(8)), user);
    title = topic.title;
    description = topic.description;
    cover = topic.cover || topic.previewCover;
    noindex = topic.status !== "online";
    body =
      `<nav class="breadcrumb"><a href="/topics">专题</a><span>/</span><span>${e(title)}</span></nav><section class="topic-detail-heading">${topicCover(topic)}<div><span class="eyebrow">CURATED PATH</span><h1>${e(title)}</h1><p>${e(description)}</p>${topicMeta(topic)}</div></section>` +
      `<section class="topic-path" aria-label="专题内容">${topic.items.length ? `<div class="card-grid">${topic.items.map((item, index) => card(item, { sequence: index + 1 })).join("")}</div>` : empty("路径正在整理中", "核验中的条目会在完成复核后显示。")}</section>`;
  } else if (path.startsWith("/creators/")) {
    const c = await service.creator(decodeURIComponent(path.slice(10)), query);
    title = c.author.nickname;
    body =
      intro(
        "COMMUNITY CREATOR",
        e(title),
        e(c.author.bio || "在实践中发现，在分享中共建。"),
      ) +
      section(
        "公开资源",
        "",
        cards(c.resources.items) + pager(c.resources, path, query),
      ) +
      section(
        "实战教程",
        "",
        cards(c.articles.items) + pager(c.articles, path, query),
      );
  } else if (path === "/updates") {
    title = "最近更新";
    const result = await service.updates(query);
    body =
      intro(
        "ALWAYS EVOLVING",
        "让资源跟上 AI 的变化。",
        "新发布、实质更新与完成核验分别记录，推荐不改变更新时间。",
      ) +
      `<div class="updates-list">${result.items.map((i) => `<a href="${contentPath(i.target_type, i.target_id)}"><span class="badge">${{ published: "新发布", updated: "内容更新", verified: "完成核验" }[i.event]}</span><div><h3>${e(i.title)}</h3><p>v${i.revision} · ${e(VERIFICATION_LABELS[i.summary] || i.summary)}</p></div><time>${date(i.event_at)}</time><b>↗</b></a>`).join("") || empty("暂时没有更新记录")}</div>` +
      pager(result, path, query);
  } else if (path === "/search") {
    title = "搜索";
    noindex = true;
    const result = query.q ? await service.search(query) : null;
    body =
      intro(
        "FIND YOUR NEXT STEP",
        "从任务出发，找到答案。",
        "搜索资源用途、平台、教程与专题。",
      ) +
      `<form class="hero-search" action="/search"><input name="q" aria-label="搜索" value="${e(query.q)}" placeholder="例如：建筑方案、角色一致性、声音克隆"><button class="button">搜索</button></form>` +
      (result
        ? section(
            `资源 · ${result.resources.total}`,
            "",
            cards(result.resources.items) +
              pager(result.resources, path, query),
          ) +
          section(
            `教程 · ${result.articles.total}`,
            "",
            cards(result.articles.items) + pager(result.articles, path, query),
          ) +
          section(
            `专题 · ${result.topics.total}`,
            "",
            `<div class="topic-grid">${result.topics.items.map(topicCard).join("")}</div>` +
              pager(result.topics, path, query),
          )
        : '<p class="search-start">好资源，从一个具体的问题开始。</p>');
  } else if (["/profile", "/submit", "/admin"].includes(path)) {
    noindex = true;
    title = {
      "/profile": "个人中心",
      "/submit": "发布与编辑",
      "/admin": "社区管理",
    }[path];
    data = { privatePage: path, query };
    body =
      intro(
        "YOUR COMMUNITY",
        title,
        path === "/submit"
          ? "分享有明确 AI 用途的资源，或记录一次完整实践。"
          : "让每一次分享，都保持可用。",
      ) +
      `<div id="workspace">${!user ? '<div class="empty"><h2>登录后继续</h2><p>你的发布、收藏和反馈会保存在个人账号中。</p><button class="button" data-login>登录 / 注册</button></div>' : path === "/admin" && user.role !== "admin" ? '<div class="notice">此页面仅对管理员开放。</div>' : '<div class="loading" role="status">正在加载…</div>'}</div>`;
  } else if (["/about", "/privacy"].includes(path)) {
    title = path === "/about" ? "社区说明" : "隐私与使用约定";
    body =
      intro("ABOUT SHIQI", title, "发现、分享与复用优质 AI 资源与实战方案。") +
      `<article class="panel prose"><h2>只分享与 AI 实践相关的内容</h2><p>拾器连接 AI 设计、视频、音频、开发和自动化领域。投稿需要说明 AI 用途；普通软件、通用素材和无 AI 功能的源码不独立收录。</p><h2>投稿与核验</h2><p>注册后可直接发布。详情页展示使用验证依据，分别说明资料是否核对、作者或编辑是否实际测试。失效或过期内容会进入复查，精选不等于永久适用。</p><h2>来源与使用范围</h2><p>请保留原始来源，确认你有权分享。声音、形象及训练数据需要注明来源和允许使用的范围。转载内容必须注明原文地址。请勿上传破解软件、盗版资料或未经授权的声音与形象资源。</p><h2>账号与数据</h2><p>本站保存注册邮箱、密码哈希、会话、投稿、收藏、讨论和维护记录，用于登录与社区服务。邮箱不在公开作者页展示。草稿仅保存在当前浏览器；请勿在投稿中包含密钥或私人资料。</p><h2>外部链接与统计</h2><p>文件、视频与音频在第三方网站打开，适用对应网站的使用规则。本站记录实际详情浏览和外链点击用于改善内容，不把点击量作为任务完成量。</p><h2>反馈与处理</h2><p>资源详情提供内容问题反馈入口。管理员核对后处理失效、违规或非 AI 内容，并保留处理记录。账号资料可在个人中心修改。</p></article>`;
  } else return null;
  return {
    html: layout({
      title,
      description,
      body,
      path,
      user,
      noindex,
      cover,
      data,
    }),
    status: 200,
  };
}
export function errorPage(error, path, user) {
  const status = error.statusCode || 500;
  return {
    status,
    html: layout({
      title:
        status === 404
          ? "内容不存在"
          : status === 410
            ? "内容已下架"
            : "暂时无法访问",
      path,
      user,
      noindex: true,
      body: `<div class="error-page"><span class="eyebrow">${status}</span><h1>${status === 404 ? "这里还没有你要找的内容" : status === 410 ? "这条内容已经下架" : "页面暂时无法加载"}</h1><p>${e(status >= 500 ? "请稍后重试。" : error.message)}</p>${error.details?.replacementURL ? `<a class="button" href="${e(error.details.replacementURL)}" target="_blank" rel="noopener noreferrer">查看替代方案 ↗</a>` : ""}<a class="button secondary" href="/resources">返回资源库</a></div>`,
    }),
  };
}
export async function sitemap(db, service) {
  const paths = ["/", "/resources", "/articles", "/topics", "/updates"];
  for (const [type, table] of [
    ["resource", "resources"],
    ["article", "articles"],
  ]) {
    const values = [];
    const where = service.publicWhere("c", values);
    const rows = (
      await db.query(
        `SELECT c.id,c.user_id FROM ${table} c WHERE ${where} AND c.verified_revision=c.revision AND c.verification_method<>'unverified' LIMIT 20000`,
        values,
      )
    ).rows;
    for (const row of rows) {
      paths.push(contentPath(type, row.id));
      if (row.user_id)
        paths.push("/creators/" + encodeURIComponent(row.user_id));
    }
  }
  for (const t of (
    await db.query("SELECT slug FROM topics WHERE status='online' LIMIT 10000")
  ).rows)
    paths.push("/topics/" + t.slug);
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(paths)].map((path) => `<url><loc>${e(config.appOrigin + path)}</loc></url>`).join("")}</urlset>`;
}
