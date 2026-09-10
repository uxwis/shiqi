import { api, toast, modal, submitSafely, formError } from "./api.js";
import { escape as e } from "../shared/presentation.js";
import {
  DOMAINS,
  RESOURCE_KINDS,
  ARTICLE_KINDS,
  LINK_KINDS,
  contentPath,
} from "../shared/catalog.js";
import { renderRichBlock, readRichEditor, articleText } from "../rich-text.js";
import { options, field, area, failure } from "./forms.js";

export async function publish(container, user, query) {
  const type = query.type === "article" ? "article" : "resource",
    group = type === "article" ? "articles" : "resources";
  const [catalog, result] = await Promise.all([
    api("/api/catalog"),
    query.id ? api(`/api/${group}/${encodeURIComponent(query.id)}`) : null,
  ]);
  const item = result?.item || {},
    details = item.details || {};
  if (result && user.role !== "admin" && user.id !== item.userId)
    throw new Error("只能编辑自己发布的内容");
  const detailFields = [
    ["version", "适用版本"],
    ["cost", "费用与额度"],
    ["requirements", "依赖与环境"],
    ["inputs", "任务输入"],
    ["steps", "步骤说明"],
    ["output", "成果 / 结果说明"],
    ["limitations", "已知限制"],
    ["rights", "声音 / 形象的来源与允许使用范围"],
  ];
  container.innerHTML = `<div class="publish-layout"><div>
    <div class="type-switch" role="tablist" aria-label="内容类型"><button id="publish-tab-resource" type="button" role="tab" data-publish-type="resource" aria-selected="${type === "resource"}" aria-controls="publish-panel" tabindex="${type === "resource" ? 0 : -1}">AI 资源</button><button id="publish-tab-article" type="button" role="tab" data-publish-type="article" aria-selected="${type === "article"}" aria-controls="publish-panel" tabindex="${type === "article" ? 0 : -1}">实战教程</button></div>
    <div id="publish-panel" class="publish-panel" role="tabpanel" aria-labelledby="publish-tab-${type}"><form id="publish-form" class="panel" novalidate>
      <nav class="steps" aria-label="发布步骤"><button type="button" data-step="0">01 基本信息</button><button type="button" data-step="1">02 内容与资料</button><button type="button" data-step="2">03 预览发布</button></nav>
      <div data-stage="0"><h2>${query.id ? "编辑" : "分享"}${type === "article" ? "一次 AI 实践" : "一个 AI 资源"}</h2>
        ${field(type === "article" ? "title" : "name", type === "article" ? "教程标题 *" : "资源名称 *", item.title, `required minlength="${type === "article" ? 4 : 2}" maxlength="${type === "article" ? 120 : 80}"`)}
        <div class="form-grid"><label>主领域 *<select name="domain" required>${options(DOMAINS, item.domain, "请选择 AI 应用领域")}</select></label><label>${type === "article" ? "教程类型" : "资源形态"} *<select name="kind" required>${options(type === "article" ? ARTICLE_KINDS : RESOURCE_KINDS, item.kind)}</select></label></div>
        ${area("aiUse", type === "article" ? "AI 任务目标 *" : "明确的 AI 用途 *", item.aiUse, 'required minlength="10" maxlength="600" placeholder="说明使用什么 AI 能力，帮助谁完成什么任务。至少 10 个字。"')}
        ${type === "resource" ? field("website", "来源或获取链接 *", item.website, 'type="url" required placeholder="https://"') : ""}
        <div class="form-grid">${field("industries", "使用行业", item.industries?.join("，"), 'list="industry-list" placeholder="建筑，服装，教育…"')}${field("platforms", "模型 / 平台", item.platforms?.join("，"), 'list="platform-list" placeholder="多个标签用逗号分隔"')}</div>
        ${field("tags", "任务标签", item.tags?.join("，"), 'list="task-list" placeholder="角色一致性，方案表达…"')}
        <datalist id="industry-list">${options(catalog.industries)}</datalist><datalist id="platform-list">${options(catalog.platforms)}</datalist><datalist id="task-list">${options(catalog.tasks)}</datalist>
      </div>
      <div data-stage="1" hidden><h2>让资源可以被理解与复用</h2>
        ${field("cover", "成果封面外链", item.cover?.startsWith("/uploads/") ? "" : item.cover, 'type="url" placeholder="https://…"')}
        <div class="inline-fields"><label class="file-upload">上传封面<input id="cover-file" type="file" accept="image/png,image/jpeg,image/webp"></label><span id="cover-status">${item.cover?.startsWith("/uploads/") ? "已保留上传封面" : ""}</span></div>
        <img id="cover-preview" class="upload-preview" ${item.cover ? `src="${e(item.cover)}"` : "hidden"} alt="封面预览">
        ${type === "article" ? `${area("excerpt", "摘要", item.excerpt, 'maxlength="300"')}<label id="editor-label">正文 *（至少 80 字）</label><div class="editor-toolbar"><button type="button" data-format="h2">标题</button><button type="button" data-format="p">正文</button><button type="button" data-format="bold">加粗</button><button type="button" data-format="insertUnorderedList">列表</button><button type="button" data-insert="code">代码块</button><button type="button" data-insert="image">图片</button><button type="button" data-insert="bilibili">B站视频</button><button type="button" data-insert="resource">引用资源</button></div><div id="rich-editor" class="rich-editor prose" role="textbox" aria-labelledby="editor-label" aria-multiline="true" contenteditable="true">${(item.body || []).map(renderRichBlock).join("") || "<p><br></p>"}</div>` : area("description", "详细说明", item.description, 'maxlength="10000" placeholder="功能、用法、适用场景与限制。"')}
        <div class="form-grid"><label>内容来源<select name="origin">${options(
          [
            { id: "original", name: "原创" },
            { id: "adapted", name: "改编" },
            { id: "repost", name: "转载" },
          ],
          details.origin,
        )}</select></label>${field("sourceURL", "原始来源链接（转载 / 改编必填）", details.sourceURL, 'type="url"')}</div>
        ${type === "article" ? '<label>关联站内资源<input id="resource-search" placeholder="搜索并选择资源"><div id="resource-results"></div></label><div id="related-resources" class="selected-resources"></div>' : ""}
        <details class="optional-fields"><summary>版本、环境与使用条件</summary>${detailFields.map(([key, label]) => area(key, label, details[key])).join("")}</details>
        <h3>配套外链</h3><p class="field-hint">视频、音频、工作流或仓库。文件保存在来源站点。</p><div id="links-editor"></div><button type="button" id="add-link" class="button secondary small">＋ 添加链接</button>
        ${field("originalPublishedAt", "原始发布时间（未知可留空）", item.originalPublishedAt?.slice(0, 10), 'type="date"')}${area("updateNote", "本次更新说明", "", 'placeholder="说明版本、流程或关键链接的具体变化。"')}
      </div>
      <div data-stage="2" hidden><h2>发布前预览</h2><div id="publish-preview" class="prose"></div><div class="notice">投稿直接公开，核验状态单独展示。实质修改会生成新修订，旧核验保留为历史记录。</div><label class="check"><input type="checkbox" name="aiConfirmed" required> 内容有明确的 AI 用途，来源与使用范围已如实说明。</label></div>
      <div class="form-footer"><span id="draft-status" role="status">草稿保存在当前浏览器</span><div><button type="button" id="previous-stage" class="button secondary">上一步</button><button type="button" id="next-stage" class="button">下一步 →</button><button type="submit" id="publish-button" class="button" hidden>${query.id ? "保存更新" : "发布内容"}</button></div></div>${failure}
    </form></div></div><aside class="panel publish-help"><span class="eyebrow">SHARE SOMETHING USEFUL</span><h3>从“发现”到“能用”</h3><ol><li>说清楚要解决的问题</li><li>给出真实的资源入口</li><li>注明版本、费用与限制</li><li>提供成果或验证说明</li></ol><p>普通软件、通用素材、传统课程和无 AI 功能的源码不独立收录。</p><p>保存版本变更后，可从详情页提交作者自测。</p>${query.id ? '<button class="text-button danger" id="delete-content">删除这条投稿</button>' : ""}</aside></div>`;
  const form = container.querySelector("form"),
    editor = form.querySelector("#rich-editor");
  let stage = 0,
    uploadedCover = item.cover?.startsWith("/uploads/") ? item.cover : "",
    related = result?.relatedResources || [],
    savedRange = null;
  const key = `shiqi:draft:${user.id}:${type}:${query.id || "new"}`;
  // Each type retains its own draft; returning to an edit tab retains its id.
  if (query.id) container.publishEditTarget = { type, id: query.id };
  const tabButtons = [...container.querySelectorAll("[data-publish-type]")];
  tabButtons.forEach((button) => {
    button.onclick = async () => {
      const nextType = button.dataset.publishType;
      if (nextType === type) return;
      saveDraft();
      tabButtons.forEach((tab) => { tab.disabled = true; });
      const nextQuery = { type: nextType };
      if (container.publishEditTarget?.type === nextType)
        nextQuery.id = container.publishEditTarget.id;
      try {
        await publish(container, user, nextQuery);
        history.pushState(null, "", "/submit?" + new URLSearchParams(nextQuery));
        container.querySelector('[data-publish-type="' + nextType + '"]').focus({ preventScroll: true });
      } catch (error) {
        tabButtons.forEach((tab) => { tab.disabled = false; });
        toast(error.message);
      }
    };
    button.onkeydown = (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - tabButtons.indexOf(button);
      tabButtons[index].click();
    };
  });
  if (!container.publishHistoryBound) {
    container.publishHistoryBound = true;
    window.addEventListener("popstate", () => {
      if (location.pathname === "/submit")
        publish(container, user, Object.fromEntries(new URLSearchParams(location.search))).catch((error) => toast(error.message));
    });
  }
  function addLink(link = {}) {
    const row = document.createElement("div");
    row.className = "link-row";
    row.innerHTML = `<select aria-label="链接用途">${options(LINK_KINDS, link.kind)}</select><input aria-label="链接名称" placeholder="链接说明" value="${e(link.label)}"><input type="url" aria-label="外链地址" placeholder="https://" value="${e(link.url)}"><button type="button" aria-label="删除此链接">×</button>`;
    row.querySelector("button").onclick = () => {
      row.remove();
      saveDraft();
    };
    form.querySelector("#links-editor").append(row);
  }
  (result?.links || []).forEach(addLink);
  form.querySelector("#add-link").onclick = () => addLink();
  function relatedUI() {
    if (!editor) return;
    form.querySelector("#related-resources").innerHTML = related
      .map(
        (i) =>
          `<span>${e(i.title || i.id)} <button type="button" data-remove-resource="${e(i.id)}" aria-label="移除关联资源">×</button></span>`,
      )
      .join("");
    form.querySelectorAll("[data-remove-resource]").forEach(
      (b) =>
        (b.onclick = () => {
          related = related.filter((i) => i.id !== b.dataset.removeResource);
          relatedUI();
          saveDraft();
        }),
    );
  }
  relatedUI();
  function read() {
    const body = Object.fromEntries(new FormData(form));
    delete body.aiConfirmed;
    body.details = {};
    for (const key of [
      ...detailFields.map(([k]) => k),
      "sourceURL",
      "origin",
      "updateNote",
    ]) {
      body.details[key] = body[key] || "";
      delete body[key];
    }
    body.links = [...form.querySelectorAll(".link-row")]
      .map((row) => {
        const inputs = row.querySelectorAll("input");
        return {
          kind: row.querySelector("select").value,
          label: inputs[0].value,
          url: inputs[1].value,
        };
      })
      .filter((l) => l.url);
    body.resourceIds = related.map((i) => i.id);
    if (editor) body.body = readRichEditor(editor);
    if (type === "resource") {
      body.coverImage = body.cover || uploadedCover;
      delete body.cover;
    } else body.cover = body.cover || uploadedCover;
    if (query.id) body.revision = item.revision;
    return body;
  }
  function saveDraft() {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          fields: Object.fromEntries(new FormData(form)),
          body: editor ? readRichEditor(editor) : [],
          links: read().links,
          related,
          uploadedCover,
          revision: item.revision || null,
          savedAt: Date.now(),
        }),
      );
      form.querySelector("#draft-status").textContent =
        "草稿已保存 · " +
        new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        });
    } catch {
      form.querySelector("#draft-status").textContent =
        "浏览器未允许保存草稿，请暂时不要关闭页面";
    }
  }
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (saved && saved.revision === (item.revision || null)) {
      for (const [name, value] of Object.entries(saved.fields)) {
        const input = form.elements.namedItem(name);
        if (input && input.type !== "file" && input.type !== "checkbox")
          input.value = value;
      }
      if (editor) editor.innerHTML = saved.body.map(renderRichBlock).join("");
      form.querySelector("#links-editor").replaceChildren();
      saved.links.forEach(addLink);
      related = saved.related || [];
      uploadedCover = saved.uploadedCover || "";
      relatedUI();
      form.querySelector("#draft-status").textContent = "已恢复当前账号的草稿";
    } else if (saved)
      form.querySelector("#draft-status").textContent =
        "内容版本已变化，当前显示最新版本。";
  } catch {}
  form.addEventListener("input", saveDraft);
  function preview() {
    const body = read();
    form.querySelector("#publish-preview").innerHTML =
      `<h2>${e(body.title || body.name)}</h2><p>${e(body.aiUse)}</p>${editor ? body.body.map(renderRichBlock).join("") : `<p>${e(body.description)}</p>`}<h3>使用条件</h3>${detailFields
        .filter(([key]) => body.details[key])
        .map(
          ([key, label]) =>
            `<p><strong>${label}</strong>：${e(body.details[key])}</p>`,
        )
        .join(
          "",
        )}<h3>配套资料</h3>${body.links.map((l) => `<p>${e(l.label)} · ${e(l.url)}</p>`).join("")}${related.map((i) => `<p>关联资源：${e(i.title)}</p>`).join("")}`;
  }
  function setStage(next) {
    stage = Math.max(0, Math.min(2, next));
    form
      .querySelectorAll("[data-stage]")
      .forEach((el) => (el.hidden = Number(el.dataset.stage) !== stage));
    form
      .querySelectorAll("[data-step]")
      .forEach((el) =>
        el.setAttribute(
          "aria-current",
          Number(el.dataset.step) === stage ? "step" : "false",
        ),
      );
    form.querySelector("#previous-stage").hidden = stage === 0;
    form.querySelector("#next-stage").hidden = stage === 2;
    form.querySelector("#publish-button").hidden = stage !== 2;
    if (stage === 2) preview();
  }
  setStage(0);
  form
    .querySelectorAll("[data-step]")
    .forEach((b) => (b.onclick = () => setStage(Number(b.dataset.step))));
  form.querySelector("#previous-stage").onclick = () => setStage(stage - 1);
  form.querySelector("#next-stage").onclick = () => {
    const invalid = [
      ...form
        .querySelector(`[data-stage="${stage}"]`)
        .querySelectorAll("input,select,textarea"),
    ].find((i) => !i.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    setStage(stage + 1);
    saveDraft();
  };
  form.onsubmit = (event) => {
    event.preventDefault();
    submitSafely(form, async () => {
      const invalid = [...form.querySelectorAll("input,select,textarea")].find(
        (i) => !i.checkValidity(),
      );
      if (invalid) {
        setStage(Number(invalid.closest("[data-stage]")?.dataset.stage || 0));
        invalid.reportValidity();
        return;
      }
      const body = read();
      if (editor && articleText(body.body).length < 80) {
        setStage(1);
        editor.focus();
        throw new Error("教程正文至少需要 80 个字");
      }
      saveDraft();
      const result = await api(
        `/api/${group}${query.id ? "/" + encodeURIComponent(query.id) : ""}`,
        { method: query.id ? "PATCH" : "POST", body },
      );
      try {
        localStorage.removeItem(key);
      } catch {}
      location.href = contentPath(type, result.item.id);
    });
  };
  form.querySelector("#cover-file").onchange = () =>
    submitSafely(form, async () => {
      const image = form.querySelector("#cover-file").files[0];
      if (!image) return;
      if (image.size > 512 * 1024) throw new Error("封面需小于 512 KB");
      const dataURL = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });
      const data = await api("/api/uploads/images", {
        method: "POST",
        body: { images: [dataURL] },
      });
      uploadedCover = data.images[0];
      form.elements.cover.value = "";
      const imageEl = form.querySelector("#cover-preview");
      imageEl.src = uploadedCover;
      imageEl.hidden = false;
      form.querySelector("#cover-status").textContent = "封面已上传";
      saveDraft();
    });
  if (editor) {
    editor.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove-video]");
      if (!remove) return;
      remove.closest(".article-video").remove();
      saveDraft();
    });
    editor.addEventListener("keyup", () => {
      const s = getSelection();
      if (s.rangeCount) savedRange = s.getRangeAt(0).cloneRange();
    });
    editor.addEventListener("mouseup", () => {
      const s = getSelection();
      if (s.rangeCount) savedRange = s.getRangeAt(0).cloneRange();
    });
    form.querySelectorAll("[data-format]").forEach(
      (b) =>
        (b.onclick = () => {
          editor.focus();
          if (savedRange) {
            const s = getSelection();
            s.removeAllRanges();
            s.addRange(savedRange);
          }
          document.execCommand(
            ["h2", "p"].includes(b.dataset.format)
              ? "formatBlock"
              : b.dataset.format,
            false,
            ["h2", "p"].includes(b.dataset.format) ? b.dataset.format : null,
          );
          saveDraft();
        }),
    );
    editor.addEventListener("paste", (event) => {
      event.preventDefault();
      document.execCommand(
        "insertText",
        false,
        event.clipboardData.getData("text/plain"),
      );
      saveDraft();
    });
    form.querySelectorAll("[data-insert]").forEach(
      (b) =>
        (b.onclick = () => {
          const kind = b.dataset.insert;
          if (kind === "resource") {
            form.querySelector("#resource-search").focus();
            return;
          }
          const dialog = modal(
            `<h2>插入${kind === "code" ? "代码块" : kind === "bilibili" ? "B站视频" : "图片"}</h2><form>${kind === "code" ? field("language", "语言") + area("text", "代码", "", "required") : kind === "bilibili" ? field("src", "B站视频链接或 BV 号", "", 'required placeholder="https://www.bilibili.com/video/BV…"') + field("title", "视频说明（可选）") : field("src", "图片外链", "", 'type="url" required') + field("alt", "图片说明")}<button class="button" type="submit">插入正文</button>${failure}</form>`,
          );
          dialog.querySelector("form").onsubmit = (event) => {
            event.preventDefault();
            try {
              editor.insertAdjacentHTML(
                "beforeend",
                renderRichBlock({
                  type: kind,
                  ...Object.fromEntries(new FormData(event.target)),
                }),
              );
              dialog.close();
              saveDraft();
            } catch (error) {
              formError(event.target, error);
            }
          };
        }),
    );
    let timer,
      sequence = 0;
    const search = form.querySelector("#resource-search");
    search.oninput = () => {
      clearTimeout(timer);
      const token = ++sequence;
      timer = setTimeout(async () => {
        try {
          const found = await api(
            "/api/resources?q=" +
              encodeURIComponent(search.value) +
              "&pageSize=8",
          );
          if (token !== sequence) return;
          const results = form.querySelector("#resource-results");
          results.innerHTML =
            found.items
              .map(
                (i) =>
                  `<button type="button" data-resource="${e(i.id)}">${e(i.title)}</button>`,
              )
              .join("") || "<small>没有找到可关联的资源</small>";
          results.querySelectorAll("button").forEach(
            (b) =>
              (b.onclick = () => {
                const resource = found.items.find(
                  (i) => i.id === b.dataset.resource,
                );
                if (!related.some((i) => i.id === resource.id))
                  related.push(resource);
                relatedUI();
                results.replaceChildren();
                search.value = "";
                saveDraft();
              }),
          );
        } catch (error) {
          toast(error.message);
        }
      }, 250);
    };
  }
  container.querySelector("#delete-content")?.addEventListener("click", () => {
    const dialog = modal(
      '<h2>删除这条投稿？</h2><p class="dialog-description">内容将从公开页面移除，历史维护记录会保留。</p><button id="confirm-delete" class="button danger">确认删除</button>',
    );
    dialog.querySelector("#confirm-delete").onclick = async () => {
      try {
        await api(`/api/${group}/${encodeURIComponent(query.id)}`, {
          method: "DELETE",
        });
        try {
          localStorage.removeItem(key);
        } catch {}
        location.href = "/profile";
      } catch (error) {
        toast(error.message);
      }
    };
  });
}
