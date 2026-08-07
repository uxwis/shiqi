import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, normalize, relative, resolve } from "node:path";
import { config } from "./config.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

export class ApiError extends Error {
  constructor(statusCode, message, code = "REQUEST_ERROR", details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function sendJSON(res, statusCode, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

export function sendNoContent(res, headers = {}) {
  res.writeHead(204, { "Cache-Control": "no-store", ...headers });
  res.end();
}

export async function readJSON(req, { maxBytes = 256 * 1024 } = {}) {
  const contentType = String(req.headers["content-type"] || "").split(";")[0].trim();
  if (contentType !== "application/json") throw new ApiError(415, "请求必须使用 application/json", "UNSUPPORTED_MEDIA_TYPE");
  const declared = Number(req.headers["content-length"] || 0);
  if (declared > maxBytes) throw new ApiError(413, "请求内容过大", "PAYLOAD_TOO_LARGE");
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new ApiError(413, "请求内容过大", "PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "JSON 格式不正确", "INVALID_JSON"); }
}

export function clientIP(req) {
  if (config.trustProxy) {
    const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (forwarded) return forwarded.slice(0, 80);
  }
  return String(req.socket.remoteAddress || "unknown").slice(0, 80);
}

export function assertSameOrigin(req) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.origin;
  if (origin && origin !== config.appOrigin) throw new ApiError(403, "请求来源无效", "INVALID_ORIGIN");
}

export function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  const upgrade = config.production ? "; upgrade-insecure-requests" : "";
  res.setHeader("Content-Security-Policy", `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'${upgrade}`);
  if (config.production) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}

function safeFile(root, pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = normalize(decoded).replace(/^[/\\]+/, "");
  const file = resolve(root, normalized || "index.html");
  const rel = relative(resolve(root), file);
  if (rel.startsWith("..") || rel.includes(`..${process.platform === "win32" ? "\\" : "/"}`)) return null;
  return file;
}

export async function serveStatic(req, res, root, pathname, { immutable = false } = {}) {
  const filePath = safeFile(root, pathname);
  if (!filePath) return false;
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return false;
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": fileStat.size,
      "Cache-Control": immutable ? "public, max-age=31536000, immutable" : (config.production ? "public, max-age=300" : "no-store"),
    });
    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

export async function serveAppFile(req, res, root, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  return serveStatic(req, res, root, requested, { immutable: pathname.startsWith("/assets/") });
}
