import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config, validateProductionConfig } from "./config.mjs";
import { createDatabase } from "./db.mjs";
import { createRepository } from "./repository.mjs";
import { createRateLimiter } from "./rate-limit.mjs";
import { sendVerificationCode } from "./mailer.mjs";
import { storeImageDataURL } from "./storage.mjs";
import {
  ApiError,
  applySecurityHeaders,
  assertSameOrigin,
  clientIP,
  sendJSON,
  serveStatic,
} from "./http.mjs";
import { requestUser, authAPI } from "./auth-api.mjs";
import { createCommunityService } from "./community-service.mjs";
import { createCommunityAPI } from "./community-api.mjs";
import { createMaintenance } from "./maintenance.mjs";
import { renderPage, errorPage, sitemap } from "./pages.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function createApp({
  database,
  repository,
  mailer = sendVerificationCode,
  imageStore = storeImageDataURL,
  now,
  linkChecker,
} = {}) {
  if (config.production) validateProductionConfig();
  const db = database || createDatabase(),
    repo = repository || createRepository(db, { now });
  const service = createCommunityService(db, { now: now || repo.now });
  const maintenance = createMaintenance(db, {
    now: now || repo.now,
    ...(linkChecker ? { check: linkChecker } : {}),
  });
  const contentAPI = createCommunityAPI(db, service, maintenance),
    consumeRate = createRateLimiter();
  const handler = async (req, res) => {
    applySecurityHeaders(res);
    let user = null,
      url;
    try {
      url = new URL(req.url, config.appOrigin);
      if (
        process.env.WRITE_MAINTENANCE === "true" &&
        !["GET", "HEAD"].includes(req.method)
      )
        throw new ApiError(503, "站点正在维护，请稍后提交");
      if (url.pathname.startsWith("/api/")) {
        assertSameOrigin(req);
        if (url.pathname === "/api/health" && req.method === "GET") {
          await db.query("SELECT 1");
          return sendJSON(res, 200, { ok: true, service: "shiqi" });
        }
        user = await requestUser(repo, req);
        const context = {
          req,
          res,
          url,
          user,
          repository: repo,
          consumeRate,
          ip: clientIP(req),
        };
        if (
          url.pathname.startsWith("/api/auth/") ||
          ["/api/me/profile", "/api/uploads/images"].includes(url.pathname)
        )
          return await authAPI(context, { mailer, imageStore });
        return await contentAPI(context);
      }
      if (!["GET", "HEAD"].includes(req.method))
        throw new ApiError(405, "此地址不支持该操作");
      if (url.pathname.startsWith(config.upload.publicPath + "/")) {
        if (
          await serveStatic(
            req,
            res,
            config.upload.directory,
            url.pathname.slice(config.upload.publicPath.length),
            { immutable: true },
          )
        )
          return;
        throw new ApiError(404, "图片不存在");
      }
      if (
        ["/app.js", "/styles.css", "/rich-text.js", "/favicon.png"].includes(
          url.pathname,
        ) ||
        /^\/(client|shared|assets)\/[a-zA-Z0-9_./-]+$/.test(url.pathname)
      ) {
        if (await serveStatic(req, res, root, url.pathname)) return;
        throw new ApiError(404, "文件不存在");
      }
      if (url.pathname === "/robots.txt") {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end(
          "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /profile\nDisallow: /submit\nSitemap: " +
            config.appOrigin +
            "/sitemap.xml",
        );
      }
      if (url.pathname === "/sitemap.xml") {
        res.writeHead(200, {
          "Content-Type": "application/xml; charset=utf-8",
        });
        return res.end(await sitemap(db, service));
      }
      user = await requestUser(repo, req);
      const page = await renderPage(url, service, user);
      if (!page) throw new ApiError(404, "页面不存在", "NOT_FOUND");
      res.writeHead(page.status, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? "" : page.html);
    } catch (error) {
      const status =
        error.statusCode ||
        (error.code === "23505" ? 409 : error.code === "23503" ? 400 : 500);
      error.statusCode = status;
      if (status >= 500) console.error(error);
      if (res.headersSent) return res.end();
      if (url?.pathname.startsWith("/api/"))
        return sendJSON(res, status, {
          error: {
            code: error.code || "REQUEST_ERROR",
            message: status >= 500 ? "服务器暂时无法处理请求" : error.message,
            details: error.details,
          },
        });
      const page = errorPage(error, url?.pathname || "/", user);
      res.writeHead(page.status, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(page.html);
    }
  };
  return { handler, database: db, repository: repo, service, maintenance };
}
export async function startServer(options = {}) {
  const app = createApp(options);
  await app.repository.deleteExpiredSessions();
  const server = createServer(app.handler);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, resolve);
  });
  app.maintenance.start();
  server.on("close", () => app.maintenance.stop());
  return { ...app, server };
}
