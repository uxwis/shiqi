// A small, shared document format. Only text and explicitly supported formatting
// are stored; arbitrary pasted HTML never becomes executable article markup.
const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export function safeRichLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

function cleanRuns(value) {
  if (!Array.isArray(value) || value.length > 1000) throw new Error("正文格式不正确");
  return value.map(run => {
    if (!run || typeof run.text !== "string") throw new Error("正文格式不正确");
    return { text: run.text, ...(run.bold === true ? { bold: true } : {}), ...(run.italic === true ? { italic: true } : {}), ...(safeRichLink(run.href) ? { href: safeRichLink(run.href) } : {}) };
  });
}

export function normalizeBlock(block) {
  if (typeof block === "string") return block;
  if (!block || !["p", "h2", "h3", "blockquote", "ul", "ol"].includes(block.type)) throw new Error("正文格式不正确");
  if (["ul", "ol"].includes(block.type)) {
    if (!Array.isArray(block.items) || block.items.length > 100) throw new Error("列表格式不正确");
    return { type: block.type, items: block.items.map(cleanRuns) };
  }
  return { type: block.type, content: cleanRuns(block.content) };
}

export function blockText(block) {
  if (typeof block === "string") return block;
  return block?.items ? block.items.map(runs => runs.map(run => run.text).join("")).join("\n") : (block?.content || []).map(run => run.text).join("");
}

export function articleText(body = []) { return body.map(blockText).join("\n\n"); }

function renderRuns(runs) {
  return runs.map(run => {
    let html = escape(run.text).replace(/\n/g, "<br>");
    if (run.bold) html = `<strong>${html}</strong>`;
    if (run.italic) html = `<em>${html}</em>`;
    if (safeRichLink(run.href)) html = `<a class="inline-link" href="${escape(safeRichLink(run.href))}" target="_blank" rel="noopener noreferrer">${html}</a>`;
    return html;
  }).join("");
}

export function renderRichBlock(input) {
  const block = normalizeBlock(input);
  if (typeof block === "string") return `<p>${escape(block).replace(/\n/g, "<br>")}</p>`;
  const inner = block.items ? block.items.map(runs => `<li>${renderRuns(runs)}</li>`).join("") : renderRuns(block.content);
  return `<${block.type}>${inner}</${block.type}>`;
}

export function readRichEditor(editor) {
  function runs(node, marks = {}) {
    if (node.nodeType === 3) return [{ text: node.textContent, ...marks }];
    if (node.nodeType !== 1 || ["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(node.tagName)) return [];
    if (node.tagName === "BR") return [{ text: "\n", ...marks }];
    const next = { ...marks };
    if (["B", "STRONG"].includes(node.tagName)) next.bold = true;
    if (["I", "EM"].includes(node.tagName)) next.italic = true;
    if (node.tagName === "A" && safeRichLink(node.getAttribute("href"))) next.href = safeRichLink(node.getAttribute("href"));
    return [...node.childNodes].flatMap(child => runs(child, next));
  }
  const blocks = [];
  let inline = [];
  const flush = () => { if (inline.length) blocks.push({ type: "p", content: inline }); inline = []; };
  for (const node of editor.childNodes) {
    const type = node.nodeType === 1 ? node.tagName.toLowerCase() : "";
    if (["p", "div", "h1", "h2", "h3", "blockquote", "ul", "ol"].includes(type)) {
      flush();
      if (["ul", "ol"].includes(type)) blocks.push({ type, items: [...node.children].filter(child => child.tagName === "LI").map(child => runs(child)) });
      else if (type === "div" && [...node.children].some(child => ["DIV", "P", "UL", "OL"].includes(child.tagName))) blocks.push(...readRichEditor(node));
      else blocks.push({ type: type === "div" ? "p" : type === "h1" ? "h2" : type, content: runs(node) });
    } else inline.push(...runs(node));
  }
  flush();
  return blocks.filter(block => blockText(block).trim());
}
