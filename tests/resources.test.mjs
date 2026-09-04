import test from "node:test";
import assert from "node:assert/strict";
import { toolType } from "../app.js";
import { articleText, renderRichBlock } from "../rich-text.js";
import { cleanParagraphs } from "../server/content-policy.mjs";
import { parseWebsiteMetadata, isPublicAddress } from "../server/website-metadata.mjs";

test("legacy online tools have their own type without losing software records", () => {
  assert.equal(toolType({ category: "软件工具", subcategory: "在线工具" }), "在线工具");
  assert.equal(toolType({ category: "软件工具", subcategory: "开发工具" }), "软件工具");
  assert.equal(toolType({ category: "AI工具", subcategory: "AI 对话写作" }), "AI工具");
});

test("rich content keeps formatting while escaping markup and discarding unsafe links", () => {
  const body = cleanParagraphs([{ type: "h2", content: [{ text: "文章标题", bold: true }] }, { type: "p", content: [{ text: "<img src=x onerror=alert(1)>" + "真实的文章内容。".repeat(15), href: "javascript:alert(1)", italic: true }] }, { type: "ul", items: [[{ text: "官网", href: "https://example.com/?a=1&b=2" }]] }]);
  const html = body.map(renderRichBlock).join("");
  assert.match(html, /<h2><strong>/);
  assert.match(html, /<ul><li><a/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img|javascript:/);
  assert.match(articleText(body), /真实的文章内容/);
  assert.throws(() => cleanParagraphs([{ type: "script", content: [{ text: "bad" }] }]), /格式/);
  assert.throws(() => cleanParagraphs([{ type: "p", content: [{ text: "短文" }] }]), /80/);
});

test("OG extraction resolves relative images and decodes attributes", () => {
  const metadata = parseWebsiteMetadata(`<meta content='/cover.png?a=1&amp;b=2' property='og:image'><meta name="og:title" content="A &amp; B"><meta property="og:description" content="Official description">`, "https://example.com/tools/");
  assert.equal(metadata.image, "https://example.com/cover.png?a=1&b=2");
  assert.equal(metadata.title, "A & B");
  assert.equal(metadata.description, "Official description");
  assert.equal(parseWebsiteMetadata('<meta property="og:image" content="javascript:alert(1)">', 'https://example.com').image, "");
});

test("website fetch excludes private and special address ranges", () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1", "172.16.1.1", "100.64.0.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "2001:db8::1", "2002:7f00:1::"]) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});
