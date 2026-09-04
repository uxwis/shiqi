import { articleText } from "../rich-text.js";
import { createMetadataReader } from "./website-metadata.mjs";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config, validateProductionConfig } from "./config.mjs";
import { createDatabase } from "./db.mjs";
import { createRepository } from "./repository.mjs";
import { createRateLimiter } from "./rate-limit.mjs";
import { sendVerificationCode } from "./mailer.mjs";
import { storeImageDataURL, cleanUploadedImage } from "./storage.mjs";
import { cleanParagraphs, cleanTags, cleanText, safeExternalURL } from "./content-policy.mjs";
import { ApiError, applySecurityHeaders, assertSameOrigin, clientIP, readJSON, sendJSON, sendNoContent, serveAppFile, serveStatic } from "./http.mjs";
import { createSessionToken, createVerificationCode, hashPassword, hashToken, hashVerificationCode, normalizeEmail, parseCookies, sessionCookie, validatePassword, verifyPassword } from "./security.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const palettes = ["#d7f6e8", "#d9ddf7", "#eadbff", "#cfe9ff", "#f5dfcf", "#cdf2ef"];
const articlePalettes = ["#ffe3d9", "#e8f2d6", "#dcecff", "#eee1ff", "#dff3ed", "#f4ead9"];

function randomItem(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function initials(name) {
  return String(name || "拾器").trim().slice(0, 2).toUpperCase();
}

function match(pathname, pattern) {
  const matchResult = pattern.exec(pathname);
  return matchResult ? matchResult.slice(1).map(decodeURIComponent) : null;
}

function requestUser(repository, req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[config.auth.cookieName];
  return token ? repository.sessionUser(hashToken(token)) : Promise.resolve(null);
}

function requireUser(context) {
  if (!context.user) throw new ApiError(401, "请先登录", "AUTH_REQUIRED");
  return context.user;
}

function requireAdmin(context) {
  const user = requireUser(context);
  if (user.role !== "admin") throw new ApiError(403, "没有管理权限", "ADMIN_REQUIRED");
  return user;
}

function rate(context, bucket, options) {
  const result = context.consumeRate(`${bucket}:${context.ip}`, options);
  context.res.setHeader("X-RateLimit-Limit", result.limit);
  context.res.setHeader("X-RateLimit-Remaining", result.remaining);
  context.res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));
  if (!result.allowed) {
    context.res.setHeader("Retry-After", result.retryAfterSeconds);
    throw new ApiError(429, "操作过于频繁，请稍后再试", "RATE_LIMITED");
  }
}

async function issueSession(repository, req, res, user) {
  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(Date.now() + config.auth.ttlDays * 86_400_000);
  await repository.createSession({ userId: user.id, tokenHash, expiresAt, ipAddress: clientIP(req), userAgent: String(req.headers["user-agent"] || "").slice(0, 300) });
  res.setHeader("Set-Cookie", sessionCookie(token));
}

export function createApp({ database, repository, mailer = sendVerificationCode, imageStore = storeImageDataURL, metadataReader = createMetadataReader() } = {}) {
  if (config.production) validateProductionConfig();
  const db = database || createDatabase();
  const repo = repository || createRepository(db);
  const consumeRate = createRateLimiter();

  async function api(req, res, url) {
    const context = { req, res, url, repository: repo, ip: clientIP(req), consumeRate, user: await requestUser(repo, req) };
    const { pathname } = url;

    if (req.method === "GET" && pathname === "/api/health") {
      await db.query("SELECT 1 AS ok");
      return sendJSON(res, 200, { ok: true, service: "shiqi", timestamp: new Date().toISOString() });
    }

    if (req.method === "GET" && pathname === "/api/bootstrap") {
      const data = await repo.publicBootstrap(context.user?.id);
      return sendJSON(res, 200, { ...data, currentUser: context.user });
    }

    const metadataParams = match(pathname, /^\/api\/resources\/([^/]+)\/metadata$/);
    if (req.method === "GET" && metadataParams) {
      rate(context, "metadata", { limit: 180, windowMs: 60_000 });
      const item = (await repo.listResources()).find(item => item.id === metadataParams[0]);
      if (!item) throw new ApiError(404, "资源不存在或已下架", "NOT_FOUND");
      return sendJSON(res, 200, await metadataReader(item.website), { "Cache-Control": "public, max-age=300" });
    }

    if (req.method === "POST" && pathname === "/api/auth/request-code") {
      rate(context, "auth-code", { limit: 5, windowMs: 15 * 60_000 });
      const body = await readJSON(req);
      const email = normalizeEmail(body.email);
      const purpose = body.purpose === "reset" ? "reset" : "register";
      if (!email) throw new ApiError(400, "请输入有效邮箱", "INVALID_EMAIL");
      const existing = await repo.getUserByEmail(email);
      if (purpose === "register" && existing) throw new ApiError(409, "该邮箱已注册", "EMAIL_EXISTS");
      const generic = { ok: true, message: "如果邮箱可用，验证码将很快送达" };
      if (purpose === "reset" && !existing) return sendJSON(res, 200, generic);
      const { code, codeHash } = createVerificationCode(email, purpose);
      await repo.saveVerificationCode({ email, purpose, codeHash, expiresAt: new Date(Date.now() + 10 * 60_000) });
      const delivery = await mailer({ email, code, purpose });
      return sendJSON(res, 200, { ...generic, ...(config.production ? {} : { developmentCode: delivery.developmentCode }) });
    }

    if (req.method === "POST" && pathname === "/api/auth/register") {
      rate(context, "register", { limit: 5, windowMs: 60 * 60_000 });
      const body = await readJSON(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      const nickname = cleanText(body.nickname || `拾器用户${Math.floor(Math.random() * 9000 + 1000)}`, { name: "昵称", min: 2, max: 20 });
      if (!email) throw new ApiError(400, "请输入有效邮箱", "INVALID_EMAIL");
      if (!validatePassword(password)) throw new ApiError(400, "密码需为 10–72 位，并包含字母和数字", "WEAK_PASSWORD");
      if (!body.agreement) throw new ApiError(400, "请先同意用户协议与隐私政策", "AGREEMENT_REQUIRED");
      if (await repo.getUserByEmail(email)) throw new ApiError(409, "该邮箱已注册", "EMAIL_EXISTS");
      const validCode = await repo.consumeVerificationCode({ email, purpose: "register", codeHash: hashVerificationCode(email, "register", body.code) });
      if (!validCode) throw new ApiError(400, "验证码无效或已过期", "INVALID_CODE");
      const user = await repo.createUser({ email, passwordHash: await hashPassword(password), nickname, verified: true });
      await issueSession(repo, req, res, user);
      return sendJSON(res, 201, { user });
    }

    if (req.method === "POST" && pathname === "/api/auth/login") {
      rate(context, "login", { limit: 10, windowMs: 15 * 60_000 });
      const body = await readJSON(req);
      const email = normalizeEmail(body.email);
      const userRow = email ? await repo.getUserByEmail(email) : null;
      const valid = userRow ? await verifyPassword(String(body.password || ""), userRow.password_hash) : false;
      if (!valid || !userRow) throw new ApiError(401, "邮箱或密码不正确", "INVALID_CREDENTIALS");
      if (userRow.status !== "active") throw new ApiError(403, "该账号已被暂停使用", "ACCOUNT_DISABLED");
      const user = repo.publicUser(userRow);
      await issueSession(repo, req, res, user);
      return sendJSON(res, 200, { user });
    }

    if (req.method === "POST" && pathname === "/api/auth/logout") {
      const token = parseCookies(req.headers.cookie)[config.auth.cookieName];
      if (token) await repo.deleteSession(hashToken(token));
      return sendNoContent(res, { "Set-Cookie": sessionCookie("", { clear: true }) });
    }

    if (req.method === "GET" && pathname === "/api/auth/me") return sendJSON(res, 200, { user: context.user });

    if (req.method === "POST" && pathname === "/api/auth/reset-password") {
      rate(context, "reset", { limit: 5, windowMs: 60 * 60_000 });
      const body = await readJSON(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      if (!email || !validatePassword(password)) throw new ApiError(400, "邮箱或新密码格式不正确", "INVALID_INPUT");
      const validCode = await repo.consumeVerificationCode({ email, purpose: "reset", codeHash: hashVerificationCode(email, "reset", body.code) });
      if (!validCode) throw new ApiError(400, "验证码无效或已过期", "INVALID_CODE");
      const userRow = await repo.getUserByEmail(email);
      if (userRow) await repo.updatePassword(userRow.id, await hashPassword(password));
      return sendJSON(res, 200, { ok: true });
    }

    if (req.method === "GET" && pathname === "/api/me/dashboard") {
      const user = requireUser(context);
      return sendJSON(res, 200, await repo.dashboard(user.id));
    }

    if (req.method === "PATCH" && pathname === "/api/me/profile") {
      const user = requireUser(context);
      const body = await readJSON(req);
      const updated = await repo.updateProfile(user.id, {
        nickname: cleanText(body.nickname, { name: "昵称", min: 2, max: 20 }),
        bio: cleanText(body.bio, { name: "个人简介", max: 120 }),
        gender: ["不公开", "女", "男", "其他"].includes(body.gender) ? body.gender : "不公开",
        birthday: /^\d{4}-\d{2}-\d{2}$/.test(body.birthday || "") ? body.birthday : "",
      });
      return sendJSON(res, 200, { user: updated });
    }

    if (req.method === "POST" && pathname === "/api/uploads/images") {
      requireUser(context);
      rate(context, "upload", { limit: 20, windowMs: 60 * 60_000 });
      const body = await readJSON(req, { maxBytes: 2 * 1024 * 1024 });
      const images = Array.isArray(body.images) ? body.images.slice(0, 3) : [];
      if (!images.length) throw new ApiError(400, "请选择图片", "NO_IMAGES");
      const urls = [];
      for (const image of images) urls.push(await imageStore(image));
      return sendJSON(res, 201, { images: urls });
    }

    if (req.method === "POST" && pathname === "/api/favorites/toggle") {
      const user = requireUser(context);
      rate(context, "favorite", { limit: 60, windowMs: 60_000 });
      const body = await readJSON(req);
      const targetType = body.targetType === "article" ? "article" : "resource";
      const targetId = cleanText(body.targetId, { name: "内容编号", min: 1, max: 100 });
      return sendJSON(res, 200, await repo.toggleFavorite(user.id, targetType, targetId));
    }

    let params = match(pathname, /^\/api\/(resources|articles)\/([^/]+)\/view$/);
    if (req.method === "POST" && params) {
      rate(context, "view", { limit: 120, windowMs: 60_000 });
      const views = await repo.incrementView(params[0] === "articles" ? "article" : "resource", params[1]);
      return sendJSON(res, 200, { views });
    }

    if (req.method === "POST" && pathname === "/api/comments") {
      const user = requireUser(context);
      rate(context, "comment", { limit: 10, windowMs: 10 * 60_000 });
      const body = await readJSON(req);
      const ratingValue = Number(body.rating);
      if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) throw new ApiError(400, "评分必须为 1–5", "INVALID_RATING");
      const created = await repo.createComment({ resourceId: cleanText(body.resourceId, { name: "资源编号", min: 1, max: 100 }), userId: user.id, rating: ratingValue, content: cleanText(body.content, { name: "评价", min: 5, max: 500 }) });
      return sendJSON(res, 201, { comment: created });
    }

    params = match(pathname, /^\/api\/comments\/([^/]+)\/like$/);
    if (req.method === "POST" && params) {
      const user = requireUser(context);
      rate(context, "comment-like", { limit: 60, windowMs: 60_000 });
      return sendJSON(res, 200, await repo.likeComment(params[0], user.id));
    }

    params = match(pathname, /^\/api\/comments\/([^/]+)$/);
    if (req.method === "DELETE" && params) {
      const user = requireUser(context);
      if (!await repo.deleteOwnComment(params[0], user.id)) throw new ApiError(404, "评价不存在或无权删除", "NOT_FOUND");
      return sendNoContent(res);
    }

    if (req.method === "POST" && pathname === "/api/resources") {
      const user = requireUser(context);
      rate(context, "publish", { limit: 5, windowMs: 60 * 60_000 });
      const body = await readJSON(req);
      const tags = cleanTags(body.tags);
      const reason = cleanText(body.reason, { name: "详细体验", min: 20, max: 600 });
      const created = await repo.createResourceWithSubmission(user, {
        name: cleanText(body.name, { name: "工具名称", min: 2, max: 50 }),
        logo: initials(body.name),
        category: ["软件工具", "在线工具"].includes(body.channel) ? "软件工具" : "AI工具",
        subcategory: body.channel === "在线工具" ? "在线工具" : cleanText(body.category, { name: "分类", max: 40 }),
        tags: tags.length ? tags : ["用户分享", "效率工具"],
        color: randomItem(palettes),
        logoColor: "#272821",
        short: cleanText(body.summary, { name: "一句话介绍", max: 120 }),
        description: [cleanText(body.summary, { name: "一句话介绍", max: 120 }), reason].filter(Boolean).join(" "),
        reason,
        features: ["由社区用户真实分享", "提供可直接访问的来源链接", "适合具体任务场景", "可通过详情页反馈信息问题"],
        tutorial: ["打开官网了解工具的核心功能。", "从一个边界清楚的小任务开始体验。", "欢迎分享你的真实使用评价。"],
        scenarios: tags.length ? tags.slice(0, 3) : ["效率提升", "社区推荐"],
        website: safeExternalURL(body.website),
        coverImage: cleanUploadedImage(body.coverImage) || "",
      });
      return sendJSON(res, 201, { resource: created });
    }

    if (req.method === "POST" && pathname === "/api/articles") {
      const user = requireUser(context);
      rate(context, "publish", { limit: 5, windowMs: 60 * 60_000 });
      const body = await readJSON(req, { maxBytes: 512 * 1024 });
      const paragraphs = cleanParagraphs(body.body);
      const created = await repo.createArticleWithSubmission(user, {
        title: cleanText(body.title, { name: "文章标题", min: 4, max: 80 }),
        excerpt: cleanText(body.excerpt, { name: "文章摘要", max: 160 }),
        category: cleanText(body.category, { name: "文章分类", min: 2, max: 30 }),
        tags: cleanTags(body.tags),
        readTime: Math.max(3, Math.ceil(articleText(paragraphs).length / 350)),
        cover: randomItem(articlePalettes),
        images: Array.isArray(body.images) ? body.images.filter(image => typeof image === "string" && image.startsWith(config.upload.publicPath)).slice(0, 3) : [],
        body: paragraphs,
      });
      return sendJSON(res, 201, { article: created });
    }

    params = match(pathname, /^\/api\/submissions\/([^/]+)$/);
    if (req.method === "PATCH" && params) {
      const user = requireUser(context);
      const current = await repo.getSubmission(params[0]);
      if (!current || current.user_id !== user.id) throw new ApiError(403, "没有权限编辑该内容", "FORBIDDEN");
      const body = await readJSON(req);
      const input = current.content_type === "article" ? (() => {
        const paragraphs = cleanParagraphs(body.body);
        return { title: cleanText(body.title,{name:"文章标题",min:4,max:80}),excerpt:cleanText(body.excerpt,{name:"文章摘要",max:160}),category:cleanText(body.category,{name:"文章分类",min:2,max:30}),tags:cleanTags(body.tags),body:paragraphs,readTime:Math.max(3,Math.ceil(articleText(paragraphs).length/350)) };
      })() : (() => {
        const tags = cleanTags(body.tags);
        const reason = cleanText(body.reason,{name:"详细体验",min:20,max:600});
        const short = cleanText(body.summary,{name:"一句话介绍",max:120});
        return { name:cleanText(body.name,{name:"工具名称",min:2,max:50}),logo:initials(body.name),website:safeExternalURL(body.website),channel:["软件工具", "在线工具"].includes(body.channel) ? "软件工具" : "AI工具",category:body.channel === "在线工具" ? "在线工具" : cleanText(body.category,{name:"分类",max:40}),tags,short,reason,description:[short, reason].filter(Boolean).join(" "),scenarios:tags.slice(0,3),coverImage:cleanUploadedImage(body.coverImage) };
      })();
      const targetId = await repo.updateOwnSubmission(params[0], user.id, input);
      return sendJSON(res, 200, { targetId });
    }

    if (req.method === "DELETE" && params) {
      const user = requireUser(context);
      await repo.deleteOwnSubmission(params[0], user.id);
      return sendNoContent(res);
    }

    if (req.method === "POST" && pathname === "/api/reports") {
      rate(context, "report", { limit: 8, windowMs: 60 * 60_000 });
      const body = await readJSON(req);
      const created = await repo.createReport({
        targetId: cleanText(body.targetId,{name:"内容编号",min:1,max:100}),
        targetType: body.targetType === "article" ? "article" : "resource",
        reportType: cleanText(body.type,{name:"反馈类型",min:2,max:30}),
        detail: cleanText(body.detail,{name:"反馈说明",min:5,max:500}),
        userId: context.user?.id || null,
      });
      return sendJSON(res, 201, { report: created });
    }

    if (req.method === "GET" && pathname === "/api/admin/data") {
      requireAdmin(context);
      return sendJSON(res, 200, await repo.adminData());
    }

    params = match(pathname, /^\/api\/admin\/resources\/([^/]+)\/status$/);
    if (req.method === "PATCH" && params) {
      const admin = requireAdmin(context);
      const body = await readJSON(req);
      const status = body.status === "online" ? "online" : "offline";
      await repo.setResourceStatus(params[0], status, admin.id);
      return sendJSON(res, 200, { status });
    }

    params = match(pathname, /^\/api\/admin\/resources\/([^/]+)$/);
    if (req.method === "PATCH" && params) {
      const admin = requireAdmin(context);
      const body = await readJSON(req);
      const name = cleanText(body.name, { name: "工具名称", min: 2, max: 50 });
      const updated = await repo.updateAdminResource(params[0], {
        name,
        logo: initials(name),
        website: safeExternalURL(body.website),
        category: ["软件工具", "在线工具"].includes(body.category) ? "软件工具" : "AI工具",
        subcategory: body.category === "在线工具" ? "在线工具" : cleanText(body.subcategory, { name: "分类", max: 40 }),
        tags: cleanTags(body.tags),
        short: cleanText(body.short, { name: "一句话介绍", max: 120 }),
        description: cleanText(body.description, { name: "详细介绍", min: 20, max: 2000 }),
        status: body.status === "offline" ? "offline" : "online",
        coverImage: cleanUploadedImage(body.coverImage),
      }, admin.id);
      return sendJSON(res, 200, { resource: updated });
    }

    params = match(pathname, /^\/api\/admin\/users\/([^/]+)\/status$/);
    if (req.method === "PATCH" && params) {
      const admin = requireAdmin(context);
      const body = await readJSON(req);
      const status = body.status === "active" ? "active" : "banned";
      await repo.setUserStatus(params[0], status, admin.id);
      return sendJSON(res, 200, { status });
    }

    params = match(pathname, /^\/api\/admin\/reports\/([^/]+)$/);
    if (req.method === "PATCH" && params) {
      const admin = requireAdmin(context);
      const body = await readJSON(req);
      const status = body.status === "resolved" ? "resolved" : "dismissed";
      await repo.handleReport(params[0], status, admin.id);
      return sendJSON(res, 200, { status });
    }

    throw new ApiError(404, "接口不存在", "NOT_FOUND");
  }

  const handler = async (req, res) => {
    applySecurityHeaders(res);
    try {
      const url = new URL(req.url, config.appOrigin);
      if (url.pathname.startsWith("/api/")) {
        assertSameOrigin(req);
        return await api(req, res, url);
      }
      if (url.pathname.startsWith(`${config.upload.publicPath.replace(/\/$/, "")}/`)) {
        const relativePath = url.pathname.slice(config.upload.publicPath.length);
        if (await serveStatic(req, res, config.upload.directory, relativePath, { immutable: true })) return;
      }
      if (await serveAppFile(req, res, projectRoot, url.pathname)) return;
      sendJSON(res, 404, { error: { code: "NOT_FOUND", message: "页面不存在" } });
    } catch (error) {
      const statusCode = error.statusCode || (error.code === "23505" ? 409 : error.code === "23503" ? 400 : 500);
      if (statusCode >= 500) console.error(error);
      if (!res.headersSent) sendJSON(res, statusCode, { error: { code: error.code || "INTERNAL_ERROR", message: statusCode >= 500 ? "服务器暂时无法处理请求" : error.message, details: error.details } });
      else res.end();
    }
  };

  return { handler, database: db, repository: repo };
}

export async function startServer(options = {}) {
  const app = createApp(options);
  await app.repository.deleteExpiredSessions();
  const server = createServer(app.handler);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, resolve);
  });
  return { ...app, server };
}
