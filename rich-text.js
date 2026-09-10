import { bilibiliVideo } from "./shared/bilibili.js";

// A small, shared document format. Only text and explicitly supported formatting
// are stored; arbitrary pasted HTML never becomes executable article markup.
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

export function safeRichLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function cleanRuns(value) {
  if (!Array.isArray(value) || value.length > 1000)
    throw new Error("正文格式不正确");
  return value.map((run) => {
    if (!run || typeof run.text !== "string") throw new Error("正文格式不正确");
    return {
      text: run.text,
      ...(run.bold === true ? { bold: true } : {}),
      ...(run.italic === true ? { italic: true } : {}),
      ...(safeRichLink(run.href) ? { href: safeRichLink(run.href) } : {}),
    };
  });
}

export function normalizeBlock(block) {
  if (block?.type === "bilibili") {
    const video = bilibiliVideo(block.src);
    return { type: "bilibili", src: video.src, title: String(block.title || "").slice(0, 200) };
  }
  if (block?.type === "code")
    return {
      type: "code",
      text: String(block.text || ""),
      language: String(block.language || "")
        .replace(/[^a-z0-9+#.-]/gi, "")
        .slice(0, 30),
    };
  if (block?.type === "image") {
    const src = /^\/uploads\/[a-z0-9_-]+\.(png|webp|jpe?g)$/i.test(
      block.src || "",
    )
      ? block.src
      : safeRichLink(block.src);
    if (!src) throw new Error("图片地址不正确");
    return { type: "image", src, alt: String(block.alt || "").slice(0, 200) };
  }
  if (typeof block === "string") return block;
  if (
    !block ||
    !["p", "h2", "h3", "blockquote", "ul", "ol"].includes(block.type)
  )
    throw new Error("正文格式不正确");
  if (["ul", "ol"].includes(block.type)) {
    if (!Array.isArray(block.items) || block.items.length > 100)
      throw new Error("列表格式不正确");
    return { type: block.type, items: block.items.map(cleanRuns) };
  }
  return { type: block.type, content: cleanRuns(block.content) };
}

export function blockText(block) {
  if (block?.type === "bilibili") return (block.title || "B站视频") + " " + block.src;
  if (block?.type === "code") return block.text;
  if (block?.type === "image") return block.alt || block.src;
  if (typeof block === "string") return block;
  return block?.items
    ? block.items.map((runs) => runs.map((run) => run.text).join("")).join("\n")
    : (block?.content || []).map((run) => run.text).join("");
}

export function articleText(body = []) {
  return body.map(blockText).join("\n\n");
}

function renderRuns(runs) {
  return runs
    .map((run) => {
      let html = escape(run.text).replace(/\n/g, "<br>");
      if (run.bold) html = `<strong>${html}</strong>`;
      if (run.italic) html = `<em>${html}</em>`;
      if (safeRichLink(run.href))
        html = `<a class="inline-link" href="${escape(safeRichLink(run.href))}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      return html;
    })
    .join("");
}

export function renderRichBlock(input) {
  const block = normalizeBlock(input);
  if (typeof block === "string")
    return `<p>${escape(block).replace(/\n/g, "<br>")}</p>`;
  if (block.type === "code")
    return `<figure class="code-block"><div><small>${escape(block.language || "code")}</small><button type="button" data-copy-code>复制代码</button></div><pre><code>${escape(block.text)}</code></pre></figure>`;
  if (block.type === "bilibili") {
    const video = bilibiliVideo(block.src);
    return `<figure class="article-video" contenteditable="false" data-bilibili-src="${escape(video.src)}" data-bilibili-title="${escape(block.title)}"><div class="video-frame"><iframe src="${escape(video.embed)}" title="${escape(block.title || "B站视频播放器")}" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe></div><figcaption><span class="video-caption">${escape(block.title || "B站视频")}</span><a href="${escape(video.src)}" target="_blank" rel="noopener noreferrer">在 B站打开 ↗</a><button class="video-remove text-button" type="button" data-remove-video>移除视频</button></figcaption></figure>`;
  }
  if (block.type === "image")
    return `<figure class="article-image"><img loading="lazy" src="${escape(block.src)}" alt="${escape(block.alt)}"><figcaption>${escape(block.alt)}</figcaption></figure>`;
  const inner = block.items
    ? block.items.map((runs) => `<li>${renderRuns(runs)}</li>`).join("")
    : renderRuns(block.content);
  return `<${block.type}>${inner}</${block.type}>`;
}

export function readRichEditor(editor) {
  function runs(node, marks = {}) {
    if (node.nodeType === 3) return [{ text: node.textContent, ...marks }];
    if (
      node.nodeType !== 1 ||
      ["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(node.tagName)
    )
      return [];
    if (node.tagName === "BR") return [{ text: "\n", ...marks }];
    const next = { ...marks };
    if (["B", "STRONG"].includes(node.tagName)) next.bold = true;
    if (["I", "EM"].includes(node.tagName)) next.italic = true;
    if (node.tagName === "A" && safeRichLink(node.getAttribute("href")))
      next.href = safeRichLink(node.getAttribute("href"));
    return [...node.childNodes].flatMap((child) => runs(child, next));
  }
  const blocks = [];
  let inline = [];
  const flush = () => {
    if (inline.length) blocks.push({ type: "p", content: inline });
    inline = [];
  };
  for (const node of editor.childNodes) {
    const type = node.nodeType === 1 ? node.tagName.toLowerCase() : "";
    if (type === "figure" && node.hasAttribute("data-bilibili-src")) {
      flush();
      blocks.push(normalizeBlock({
        type: "bilibili",
        src: node.getAttribute("data-bilibili-src"),
        title: node.getAttribute("data-bilibili-title") || "",
      }));
      continue;
    }
    if (type === "figure" && node.querySelector("pre")) {
      flush();
      blocks.push({
        type: "code",
        text: node.querySelector("pre").textContent,
        language: node.querySelector("small")?.textContent || "",
      });
      continue;
    }
    if (type === "pre") {
      flush();
      blocks.push({ type: "code", text: node.textContent, language: "" });
      continue;
    }
    if ((type === "figure" && node.querySelector("img")) || type === "img") {
      flush();
      const img = type === "img" ? node : node.querySelector("img");
      blocks.push(
        normalizeBlock({
          type: "image",
          src: img.getAttribute("src"),
          alt: img.alt,
        }),
      );
      continue;
    }
    if (
      ["p", "div", "h1", "h2", "h3", "blockquote", "ul", "ol"].includes(type)
    ) {
      flush();
      if (["ul", "ol"].includes(type))
        blocks.push({
          type,
          items: [...node.children]
            .filter((child) => child.tagName === "LI")
            .map((child) => runs(child)),
        });
      else if (
        type === "div" &&
        [...node.children].some((child) =>
          ["DIV", "P", "UL", "OL"].includes(child.tagName),
        )
      )
        blocks.push(...readRichEditor(node));
      else
        blocks.push({
          type: type === "div" ? "p" : type === "h1" ? "h2" : type,
          content: runs(node),
        });
    } else inline.push(...runs(node));
  }
  flush();
  return blocks.filter((block) => blockText(block).trim());
}
