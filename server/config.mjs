import { resolve } from "node:path";

function bool(value, fallback = false) {
  if (value === undefined || value === "") return fallback;
  return /^(1|true|yes)$/i.test(value);
}

function integer(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV || "development";
const production = nodeEnv === "production";
const emailProvider = (process.env.EMAIL_PROVIDER || (process.env.ZSEND_API_KEY ? "zeabur" : process.env.SMTP_HOST ? "smtp" : "")).trim().toLowerCase();

export const config = {
  nodeEnv,
  production,
  host: process.env.HOST || "127.0.0.1",
  port: integer(process.env.PORT, 4173),
  appOrigin: process.env.APP_ORIGIN || "http://127.0.0.1:4173",
  trustProxy: bool(process.env.TRUST_PROXY),
  database: {
    url: process.env.DATABASE_URL || "",
    ssl: bool(process.env.DATABASE_SSL),
    poolMax: integer(process.env.DATABASE_POOL_MAX, 10),
  },
  auth: {
    cookieName: process.env.SESSION_COOKIE_NAME || "shiqi_session",
    ttlDays: integer(process.env.SESSION_TTL_DAYS, 30),
    passwordPepper: process.env.PASSWORD_PEPPER || "",
  },
  admin: {
    email: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "",
    nickname: process.env.ADMIN_NICKNAME || "拾器运营",
  },
  email: {
    provider: emailProvider,
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || "no-reply@example.com",
    zsendApiKey: process.env.ZSEND_API_KEY || "",
    zsendBaseUrl: (process.env.ZSEND_BASE_URL || "https://api.zeabur.com/api/v1/zsend").replace(/\/$/, ""),
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: integer(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.SMTP_FROM || "拾器 <no-reply@example.com>",
  },
  upload: {
    driver: process.env.UPLOAD_DRIVER || "local",
    directory: resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads"),
    publicPath: process.env.UPLOAD_PUBLIC_PATH || "/uploads",
    maxImageBytes: integer(process.env.MAX_IMAGE_BYTES, 512 * 1024),
  },
};

export function validateProductionConfig() {
  const missing = [];
  if (!config.database.url) missing.push("DATABASE_URL");
  if (config.auth.passwordPepper.length < 32) missing.push("PASSWORD_PEPPER（至少 32 字符）");
  if (!config.appOrigin.startsWith("https://")) missing.push("APP_ORIGIN（生产环境必须使用 HTTPS）");
  if (!config.email.provider) missing.push("EMAIL_PROVIDER（开放注册必须配置邮件服务）");
  if (config.email.provider === "zeabur" && !config.email.zsendApiKey) missing.push("ZSEND_API_KEY");
  if (config.email.provider === "smtp" && !config.smtp.host) missing.push("SMTP_HOST");
  if (config.email.provider && !["zeabur", "smtp"].includes(config.email.provider)) missing.push("EMAIL_PROVIDER（仅支持 zeabur 或 smtp）");
  if (!config.email.from || !config.email.from.includes("@")) missing.push("EMAIL_FROM");
  if (config.upload.driver !== "local") missing.push("UPLOAD_DRIVER（当前版本仅支持 local）");
  if (config.upload.driver === "local" && !process.env.UPLOAD_DIR) missing.push("UPLOAD_DIR（必须指向持久化磁盘）");
  if (missing.length) throw new Error(`生产配置不完整：${missing.join("、")}`);
}
