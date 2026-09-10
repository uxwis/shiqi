import test from "node:test";
import assert from "node:assert/strict";
import {
  DOMAINS,
  RESOURCE_KINDS,
  defaultReviewDays,
} from "../shared/catalog.js";
import { articleText, renderRichBlock } from "../rich-text.js";
import { cleanParagraphs } from "../server/content-policy.mjs";
import { isPublicAddress } from "../server/public-address.mjs";

test("AI catalog covers industries and reusable resource forms", () => {
  assert.equal(DOMAINS.length, 5);
  assert.equal(RESOURCE_KINDS.length, 7);
  assert.ok(DOMAINS.some((d) => d.id === "audio"));
  assert.ok(DOMAINS.some((d) => d.id === "coding"));
  assert.equal(defaultReviewDays("resource", "tool"), 14);
  assert.equal(defaultReviewDays("resource", "workflow"), 30);
  assert.equal(defaultReviewDays("article", "method"), 90);
});

test("rich content keeps formatting while escaping markup and discarding unsafe links", () => {
  const body = cleanParagraphs([
    { type: "h2", content: [{ text: "文章标题", bold: true }] },
    {
      type: "p",
      content: [
        {
          text: "<img src=x onerror=alert(1)>" + "真实的文章内容。".repeat(15),
          href: "javascript:alert(1)",
          italic: true,
        },
      ],
    },
    {
      type: "ul",
      items: [[{ text: "官网", href: "https://example.com/?a=1&b=2" }]],
    },
  ]);
  const html = body.map(renderRichBlock).join("");
  assert.match(html, /<h2><strong>/);
  assert.match(html, /<ul><li><a/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img|javascript:/);
  assert.match(articleText(body), /真实的文章内容/);
  assert.throws(
    () => cleanParagraphs([{ type: "script", content: [{ text: "bad" }] }]),
    /格式/,
  );
  assert.throws(
    () => cleanParagraphs([{ type: "p", content: [{ text: "短文" }] }]),
    /80/,
  );
});

test("code and external images render safely without third-party embeds", () => {
  const blocks = cleanParagraphs([
    {
      type: "p",
      content: [{ text: "介绍 AI 工作流的步骤与使用条件。".repeat(10) }],
    },
    { type: "code", language: "html", text: "<script>alert(1)</script>" },
    { type: "image", src: "https://example.com/image.png", alt: "结果 <test>" },
  ]);
  const html = blocks.map(renderRichBlock).join("");
  assert.match(html, /data-copy-code/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /loading="lazy"/);
  assert.doesNotMatch(html, /<script>|<iframe/);
  assert.throws(() =>
    cleanParagraphs([{ type: "image", src: "javascript:alert(1)" }]),
  );
});

test("website fetch excludes private and special address ranges", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.1",
    "172.16.1.1",
    "100.64.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
    "2002:7f00:1::",
  ])
    assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("Bilibili embeds normalize trusted identifiers and reject arbitrary frames", async () => {
  const { bilibiliVideo } = await import("../shared/bilibili.js");
  const { normalizeBlock } = await import("../rich-text.js");
  const original = "https://www.bilibili.com/video/BV1B7411m7LV/?p=2&autoplay=1";
  const normalized = normalizeBlock({ type: "bilibili", src: original, title: '<img onerror="alert(1)">' });
  assert.equal(normalized.src, "https://www.bilibili.com/video/BV1B7411m7LV/?p=2");
  assert.deepEqual(normalizeBlock(normalized), normalized);
  const html = renderRichBlock(normalized);
  assert.match(html, /<iframe/);
  assert.ok(html.includes("https://player.bilibili.com/player.html?bvid=BV1B7411m7LV&amp;p=2&amp;autoplay=0"));
  assert.ok(html.includes("allowfullscreen"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes('<img onerror'));
  assert.equal(bilibiliVideo("BV1B7411m7LV").src, "https://www.bilibili.com/video/BV1B7411m7LV/");
  assert.equal(bilibiliVideo('<iframe src="//player.bilibili.com/player.html?bvid=BV1B7411m7LV&amp;page=2"></iframe>').src, normalized.src);
  for (const src of ["javascript:alert(1)", "https://player.bilibili.com.evil.example/player.html?bvid=BV1B7411m7LV", "https://www.bilibili.com@evil.example/video/BV1B7411m7LV", "https://player.bilibili.com/player.html?bvid=invalid", "https://www.bilibili.com/video/BV1B7411m7LV/?p=-1"])
    assert.throws(() => normalizeBlock({ type: "bilibili", src }));
  assert.ok(articleText([normalized]).includes(normalized.src));
});
