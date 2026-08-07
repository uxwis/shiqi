import { promisify } from "node:util";
import { createHash, randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { config } from "./config.mjs";

const scrypt = promisify(scryptCallback);
const SCRYPT_OPTIONS = { N: 32_768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function uid(prefix) {
  return `${prefix}-${randomUUID()}`;
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(`${password}${config.auth.passwordPepper}`, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, saltValue, hashValue] = String(encoded).split("$");
    if (algorithm !== "scrypt") return false;
    const expected = Buffer.from(hashValue, "base64url");
    const actual = Buffer.from(await scrypt(`${password}${config.auth.passwordPepper}`, Buffer.from(saltValue, "base64url"), expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    }));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function createSessionToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function createVerificationCode(email, purpose) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  return { code, codeHash: hashVerificationCode(email, purpose, code) };
}

export function hashVerificationCode(email, purpose, code) {
  return createHash("sha256").update(`${email.toLowerCase()}|${purpose}|${code}|${config.auth.passwordPepper}`).digest("hex");
}

export function safeEqualText(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseCookies(header = "") {
  return Object.fromEntries(String(header).split(";").map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf("=");
    if (index < 0) return [part, ""];
    return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function sessionCookie(token, { clear = false } = {}) {
  const parts = [
    `${encodeURIComponent(config.auth.cookieName)}=${clear ? "" : encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    clear ? "Max-Age=0" : `Max-Age=${config.auth.ttlDays * 86_400}`,
  ];
  if (config.production) parts.push("Secure");
  return parts.join("; ");
}

export function validatePassword(password) {
  return typeof password === "string" && password.length >= 10 && password.length <= 72 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : "";
}
