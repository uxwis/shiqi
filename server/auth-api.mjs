import { config } from "./config.mjs";
import { cleanText } from "./content-policy.mjs";
import {
  ApiError,
  readJSON,
  sendJSON,
  sendNoContent,
  clientIP,
} from "./http.mjs";
import {
  createSessionToken,
  createVerificationCode,
  hashPassword,
  hashToken,
  hashVerificationCode,
  normalizeEmail,
  parseCookies,
  sessionCookie,
  validatePassword,
  verifyPassword,
} from "./security.mjs";
export function requestUser(repository, req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[config.auth.cookieName];
  return token
    ? repository.sessionUser(hashToken(token))
    : Promise.resolve(null);
}

export function requireUser(context) {
  if (!context.user) throw new ApiError(401, "请先登录", "AUTH_REQUIRED");
  return context.user;
}

export function requireAdmin(context) {
  const user = requireUser(context);
  if (user.role !== "admin")
    throw new ApiError(403, "没有管理权限", "ADMIN_REQUIRED");
  return user;
}

export function rate(context, bucket, options) {
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
  await repository.createSession({
    userId: user.id,
    tokenHash,
    expiresAt,
    ipAddress: clientIP(req),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
  });
  res.setHeader("Set-Cookie", sessionCookie(token));
}

export async function authAPI(context, { mailer, imageStore }) {
  const { req, res, url, repository: repo } = context;
  const { pathname } = url;
  if (req.method === "POST" && pathname === "/api/auth/request-code") {
    rate(context, "auth-code", { limit: 5, windowMs: 15 * 60_000 });
    const body = await readJSON(req);
    const email = normalizeEmail(body.email);
    const purpose = body.purpose === "reset" ? "reset" : "register";
    if (!email) throw new ApiError(400, "请输入有效邮箱", "INVALID_EMAIL");
    const existing = await repo.getUserByEmail(email);
    if (purpose === "register" && existing)
      throw new ApiError(409, "该邮箱已注册", "EMAIL_EXISTS");
    const generic = { ok: true, message: "如果邮箱可用，验证码将很快送达" };
    if (purpose === "reset" && !existing) return sendJSON(res, 200, generic);
    const { code, codeHash } = createVerificationCode(email, purpose);
    await repo.saveVerificationCode({
      email,
      purpose,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
    const delivery = await mailer({ email, code, purpose });
    return sendJSON(res, 200, {
      ...generic,
      ...(config.production
        ? {}
        : { developmentCode: delivery.developmentCode }),
    });
  }

  if (req.method === "POST" && pathname === "/api/auth/register") {
    rate(context, "register", { limit: 5, windowMs: 60 * 60_000 });
    const body = await readJSON(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const nickname = cleanText(
      body.nickname || `拾器用户${Math.floor(Math.random() * 9000 + 1000)}`,
      { name: "昵称", min: 2, max: 20 },
    );
    if (!email) throw new ApiError(400, "请输入有效邮箱", "INVALID_EMAIL");
    if (!validatePassword(password))
      throw new ApiError(
        400,
        "密码需为 10–72 位，并包含字母和数字",
        "WEAK_PASSWORD",
      );
    if (!body.agreement)
      throw new ApiError(
        400,
        "请先同意用户协议与隐私政策",
        "AGREEMENT_REQUIRED",
      );
    if (await repo.getUserByEmail(email))
      throw new ApiError(409, "该邮箱已注册", "EMAIL_EXISTS");
    const validCode = await repo.consumeVerificationCode({
      email,
      purpose: "register",
      codeHash: hashVerificationCode(email, "register", body.code),
    });
    if (!validCode)
      throw new ApiError(400, "验证码无效或已过期", "INVALID_CODE");
    const user = await repo.createUser({
      email,
      passwordHash: await hashPassword(password),
      nickname,
      verified: true,
    });
    await issueSession(repo, req, res, user);
    return sendJSON(res, 201, { user });
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    rate(context, "login", { limit: 10, windowMs: 15 * 60_000 });
    const body = await readJSON(req);
    const email = normalizeEmail(body.email);
    const userRow = email ? await repo.getUserByEmail(email) : null;
    const valid = userRow
      ? await verifyPassword(String(body.password || ""), userRow.password_hash)
      : false;
    if (!valid || !userRow)
      throw new ApiError(401, "邮箱或密码不正确", "INVALID_CREDENTIALS");
    if (userRow.status !== "active")
      throw new ApiError(403, "该账号已被暂停使用", "ACCOUNT_DISABLED");
    const user = repo.publicUser(userRow);
    await issueSession(repo, req, res, user);
    return sendJSON(res, 200, { user });
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    const token = parseCookies(req.headers.cookie)[config.auth.cookieName];
    if (token) await repo.deleteSession(hashToken(token));
    return sendNoContent(res, {
      "Set-Cookie": sessionCookie("", { clear: true }),
    });
  }

  if (req.method === "GET" && pathname === "/api/auth/me")
    return sendJSON(res, 200, { user: context.user });

  if (req.method === "POST" && pathname === "/api/auth/reset-password") {
    rate(context, "reset", { limit: 5, windowMs: 60 * 60_000 });
    const body = await readJSON(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    if (!email || !validatePassword(password))
      throw new ApiError(400, "邮箱或新密码格式不正确", "INVALID_INPUT");
    const validCode = await repo.consumeVerificationCode({
      email,
      purpose: "reset",
      codeHash: hashVerificationCode(email, "reset", body.code),
    });
    if (!validCode)
      throw new ApiError(400, "验证码无效或已过期", "INVALID_CODE");
    const userRow = await repo.getUserByEmail(email);
    if (userRow)
      await repo.updatePassword(userRow.id, await hashPassword(password));
    return sendJSON(res, 200, { ok: true });
  }

  if (req.method === "PATCH" && pathname === "/api/me/profile") {
    const user = requireUser(context);
    const body = await readJSON(req);
    const updated = await repo.updateProfile(user.id, {
      nickname: cleanText(body.nickname, { name: "昵称", min: 2, max: 20 }),
      bio: cleanText(body.bio, { name: "个人简介", max: 120 }),
      gender: ["不公开", "女", "男", "其他"].includes(body.gender)
        ? body.gender
        : "不公开",
      birthday: /^\d{4}-\d{2}-\d{2}$/.test(body.birthday || "")
        ? body.birthday
        : "",
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

  throw new ApiError(404, "接口不存在", "NOT_FOUND");
}
