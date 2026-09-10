import {
  DOMAINS,
  RESOURCE_KINDS,
  ARTICLE_KINDS,
  LINK_KINDS,
  defaultReviewDays,
} from "../shared/catalog.js";
import {
  cleanText,
  cleanTags,
  cleanParagraphs,
  safeExternalURL,
} from "./content-policy.mjs";
import { cleanUploadedImage } from "./storage.mjs";
import { ApiError } from "./http.mjs";
import { articleText } from "../rich-text.js";

export const tables = { resource: "resources", article: "articles" };
export function contentType(value) {
  if (!tables[value]) throw new ApiError(400, "内容类型不正确", "INVALID_TYPE");
  return value;
}
export function refFrom(body) {
  return {
    type: contentType(body.targetType || body.type),
    id: cleanText(body.targetId || body.id, {
      name: "内容编号",
      min: 1,
      max: 100,
    }),
  };
}
export function freshness(row, now = new Date()) {
  if (row.scope !== "ai") return row.scope || "legacy_review";
  if (row.status !== "online" || row.deleted_at) return "broken";
  if (
    row.review_required ||
    !row.review_due_at ||
    new Date(row.review_due_at) <= now
  )
    return "review_due";
  return row.verified_revision === row.revision
    ? row.verification_method
    : "unverified";
}
export function listed(row, now = new Date()) {
  return (
    !!row &&
    !["legacy_review", "excluded", "broken", "review_due"].includes(
      freshness(row, now),
    )
  );
}
export function detailAllowed(row) {
  return (
    !!row && row.scope === "ai" && row.status === "online" && !row.deleted_at
  );
}
export function canFeature(row, type, now = new Date()) {
  const state = freshness(row, now);
  return (
    state === "editor_tested" ||
    (type === "resource" &&
      row.content_kind === "tool" &&
      state === "source_checked")
  );
}
export function iso(value) {
  return value ? new Date(value).toISOString() : null;
}
export function parseJSON(value, fallback) {
  if (value == null) return fallback;
  return typeof value === "string" ? JSON.parse(value) : value;
}
export function external(value) {
  return value ? safeExternalURL(value) : "";
}
export function cleanLinks(value) {
  if (!Array.isArray(value)) return [];
  if (value.length > 20) throw new ApiError(400, "最多关联 20 个外链");
  const seen = new Set();
  return value
    .map((link) => ({
      kind: LINK_KINDS.some((k) => k.id === link.kind) ? link.kind : "source",
      label: cleanText(link.label, { name: "链接说明", max: 80 }),
      url: safeExternalURL(link.url),
    }))
    .filter((link) => !seen.has(link.url) && seen.add(link.url));
}
export function cleanInput(type, body, current = null) {
  contentType(type);
  const currentDetails = parseJSON(current?.details, {});
  const existing = current
    ? {
        name: current.name,
        title: current.title,
        domain: current.domain,
        kind: current.content_kind,
        aiUse: current.ai_use,
        description: current.description,
        excerpt: current.excerpt,
        body: parseJSON(current.body, []),
        tags: parseJSON(current.tags, []),
        industries: parseJSON(current.industries, []),
        platforms: parseJSON(current.platforms, []),
        website: current.website,
        coverImage: current.cover_image,
        cover: current.cover,
        details: currentDetails,
      }
    : {};
  const value = {
    ...existing,
    ...body,
    details: { ...currentDetails, ...body.details },
  };
  if (!DOMAINS.some((item) => item.id === value.domain))
    throw new ApiError(400, "请选择 AI 应用领域", "INVALID_DOMAIN");
  const kinds = type === "resource" ? RESOURCE_KINDS : ARTICLE_KINDS;
  if (!kinds.some((item) => item.id === value.kind))
    throw new ApiError(400, "请选择 AI 资源或教程类型", "INVALID_KIND");
  if (body.channel && body.channel !== "AI工具")
    throw new ApiError(400, "本站仅收录 AI 相关内容", "AI_ONLY");
  const details = {};
  for (const key of [
    "version",
    "requirements",
    "cost",
    "inputs",
    "steps",
    "output",
    "limitations",
    "rights",
    "updateNote",
  ])
    details[key] = cleanText(value.details?.[key], {
      name: "使用说明",
      max: 6000,
    });
  details.origin = ["original", "adapted", "repost"].includes(
    value.details.origin,
  )
    ? value.details.origin
    : "original";
  details.sourceURL = external(value.details.sourceURL);
  if (type === "article" && details.origin !== "original" && !details.sourceURL)
    throw new ApiError(
      400,
      "转载或改编内容需要原始来源链接",
      "SOURCE_REQUIRED",
    );
  const input = {
    domain: value.domain,
    kind: value.kind,
    aiUse: cleanText(value.aiUse, {
      name: "AI 用途 / 任务目标",
      min: 10,
      max: 600,
    }),
    tags: cleanTags(value.tags),
    industries: cleanTags(value.industries),
    platforms: cleanTags(value.platforms),
    details,
    reviewDays: defaultReviewDays(type, value.kind),
  };
  if (type === "resource") {
    input.name = cleanText(value.name, { name: "资源名称", min: 2, max: 80 });
    input.website = safeExternalURL(value.website);
    input.description = cleanText(
      value.description || value.reason || value.aiUse,
      { name: "资源介绍", min: 10, max: 10000 },
    );
    input.coverImage = value.coverImage?.startsWith("/uploads/")
      ? cleanUploadedImage(value.coverImage)
      : external(value.coverImage) || "";
  } else {
    input.title = cleanText(value.title, {
      name: "教程标题",
      min: 4,
      max: 120,
    });
    input.excerpt = cleanText(value.excerpt, { name: "摘要", max: 300 });
    input.body = cleanParagraphs(value.body);
    input.cover = value.cover?.startsWith("/uploads/")
      ? cleanUploadedImage(value.cover)
      : external(value.cover);
    input.readTime = Math.max(
      1,
      Math.ceil(articleText(input.body).length / 350),
    );
  }
  if ("links" in body || !current) input.links = cleanLinks(body.links || []);
  if ("resourceIds" in body || !current) {
    if (
      !Array.isArray(body.resourceIds || []) ||
      (body.resourceIds || []).length > 20
    )
      throw new ApiError(400, "最多关联 20 个资源");
    input.resourceIds = [
      ...new Set(
        (body.resourceIds || []).map((id) =>
          cleanText(id, { name: "关联资源", min: 1, max: 100 }),
        ),
      ),
    ];
  }
  if ("originalPublishedAt" in body) {
    const date = body.originalPublishedAt
      ? new Date(body.originalPublishedAt)
      : null;
    if (date && (!Number.isFinite(+date) || date > new Date()))
      throw new ApiError(400, "原始发布时间不正确");
    input.originalPublishedAt = date;
  }
  return input;
}
export function contentDTO(row, type, now = new Date()) {
  if (!row) return null;
  const state = freshness(row, now);
  return {
    id: row.id,
    type,
    title: row.title || row.name,
    name: row.name || row.title,
    domain: row.domain,
    kind: row.content_kind,
    aiUse: row.ai_use,
    description: row.description || "",
    excerpt: row.excerpt || row.short_description || "",
    body: parseJSON(row.body, []),
    images: parseJSON(row.images, []),
    cover:
      row.cover_image ||
      (String(row.cover || "").startsWith("#") ? "" : row.cover) ||
      "",
    website: row.website || "",
    tags: parseJSON(row.tags, []),
    industries: parseJSON(row.industries, []),
    platforms: parseJSON(row.platforms, []),
    details: parseJSON(row.details, {}),
    author: row.author || "社区作者",
    userId: row.user_id,
    scope: row.scope,
    status: row.status,
    revision: row.revision,
    freshness: state,
    verificationMethod: row.verification_method,
    verifiedAt:
      row.verified_revision === row.revision ? iso(row.verified_at) : null,
    reviewDueAt: iso(row.review_due_at),
    reviewDays: row.review_days,
    originalPublishedAt: iso(row.original_published_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.content_changed_at || row.created_at),
    featured: !!row.featured && canFeature(row, type, now),
    views: Number(row.actual_views_count || 0),
    favorites: Number(row.real_favorites || 0),
    rating: row.real_rating == null ? null : Number(row.real_rating),
    ratings: Number(row.real_ratings || 0),
    unavailableReason: row.unavailable_reason,
    replacementURL: row.replacement_url,
    deletedAt: iso(row.deleted_at),
  };
}
