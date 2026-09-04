import { normalizeBlock, blockText, articleText } from "../rich-text.js";
import { ApiError } from "./http.mjs";

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const BLOCKED_PROTOCOLS = /^(javascript|data|file|vbscript):/i;

export function cleanText(value, { name = "内容", min = 0, max = 1000 } = {}) {
  const text = String(value || "").trim();
  if (CONTROL_CHARACTERS.test(text)) throw new ApiError(400, `${name}包含无效字符`, "INVALID_CONTENT");
  if (text.length < min) throw new ApiError(400, `${name}至少需要 ${min} 个字`, "CONTENT_TOO_SHORT");
  if (text.length > max) throw new ApiError(400, `${name}不能超过 ${max} 个字`, "CONTENT_TOO_LONG");
  return text;
}

export function cleanTags(value) {
  const tags = Array.isArray(value) ? value : String(value || "").split(/[,，]/);
  return [...new Set(tags.map(tag => cleanText(tag, { name: "标签", max: 20 })).filter(tag => tag && !/(免费|付费|vip|会员)/i.test(tag)))].slice(0, 6);
}

export function safeExternalURL(value) {
  const raw = String(value || "").trim();
  if (BLOCKED_PROTOCOLS.test(raw)) throw new ApiError(400, "链接协议不安全", "UNSAFE_URL");
  let url;
  try { url = new URL(raw); } catch { throw new ApiError(400, "请输入有效的网址", "INVALID_URL"); }
  if (!["http:", "https:"].includes(url.protocol)) throw new ApiError(400, "链接必须使用 http:// 或 https://", "INVALID_URL");
  if (!url.hostname || url.username || url.password) throw new ApiError(400, "链接格式不受支持", "INVALID_URL");
  return url.href;
}

export function cleanParagraphs(value, { minTotal = 80, maxTotal = 20_000 } = {}) {
  const paragraphs = Array.isArray(value) ? value : String(value || "").split(/\n\s*\n/);
  if (paragraphs.length > 100) throw new ApiError(400, "正文不能超过 100 段", "CONTENT_TOO_LONG");
  const cleaned = paragraphs.map(paragraph => {
    if (typeof paragraph === "string") return cleanText(paragraph, { name: "正文段落", max: 4000 });
    let block;
    try { block = normalizeBlock(paragraph); } catch { throw new ApiError(400, "正文格式不正确", "INVALID_CONTENT"); }
    cleanText(blockText(block), { name: "正文段落", max: 4000 });
    return block;
  }).filter(paragraph => blockText(paragraph).trim());
  const total = articleText(cleaned).length;
  if (total < minTotal) throw new ApiError(400, `正文至少需要 ${minTotal} 个字`, "CONTENT_TOO_SHORT");
  if (total > maxTotal) throw new ApiError(400, `正文不能超过 ${maxTotal} 个字`, "CONTENT_TOO_LONG");
  const linkCount = (JSON.stringify(cleaned).match(/https?:\/\//gi) || []).length;
  if (linkCount > 12) throw new ApiError(400, "正文包含过多外部链接", "TOO_MANY_LINKS");
  return cleaned;
}
