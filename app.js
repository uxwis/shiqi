import { api, toast, modal, submitSafely, values } from "./client/api.js";
import { login } from "./client/auth.js";
import { escape as e, date, commentCard } from "./shared/presentation.js";
export { verificationCodeButtonState } from "./shared/presentation.js";

// Public HTML is already rendered by the server. Enhance it without replacing it.
if (typeof document !== "undefined") {
  const state = JSON.parse(
    document.querySelector("#page-data")?.textContent || "{}",
  );
  const dialog = document.querySelector("#dialog");
  dialog
    ?.querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  // Fragment paths are browser-only; preserve previously shared addresses.
  if (location.hash.startsWith("#/")) {
    const hash = location.hash.slice(1),
      aliases = {
        "/learning": "/articles",
        "/software": "/resources",
        "/auth": "/profile",
      };
    const path =
      aliases[hash] ||
      hash
        .replace(/^\/resource\//, "/resources/")
        .replace(/^\/article\//, "/articles/");
    if (path !== "/") location.replace(path);
    else history.replaceState(null, "", location.pathname + location.search);
  }
  document.addEventListener(
    "error",
    (event) => {
      if (event.target instanceof HTMLImageElement)
        event.target.classList.add("failed-media");
    },
    true,
  );
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button,a");
    if (!button) return;
    try {
      if (button.hasAttribute("data-login")) return login();
      if (button.hasAttribute("data-copy-code")) {
        await navigator.clipboard.writeText(
          button.closest(".code-block").querySelector("code").textContent,
        );
        return toast("代码已复制");
      }
      if (button.hasAttribute("data-outbound")) {
        api(
          `/api/${button.dataset.type === "article" ? "articles" : "resources"}/${encodeURIComponent(button.dataset.id)}/click`,
          { method: "POST", body: { linkId: button.dataset.outbound } },
        ).catch(() => {});
        return;
      }
      if (button.hasAttribute("data-favorite")) {
        if (!state.user) return login();
        const result = await api("/api/favorites/toggle", {
          method: "POST",
          body: {
            targetType: button.dataset.type,
            targetId: button.dataset.id,
          },
        });
        button.textContent = result.favorite ? "已收藏" : "收藏";
        return toast(result.favorite ? "已加入收藏" : "已取消收藏");
      }
      if (button.hasAttribute("data-report")) {
        const d = modal(
          '<h2>反馈内容问题</h2><form id="report-form"><label>问题类型<select name="reportType"><option>入口失效</option><option>版本不适用</option><option>非 AI 内容</option><option>来源或授权问题</option></select></label><label>具体说明<textarea name="detail" required minlength="5" maxlength="500"></textarea></label><button class="button" type="submit">提交反馈</button><p class="form-error" role="alert"></p></form>',
        );
        d.querySelector("form").onsubmit = (event) => {
          event.preventDefault();
          submitSafely(event.target, async () => {
            await api("/api/reports", {
              method: "POST",
              body: {
                ...values(event.target),
                targetType: button.dataset.type,
                targetId: button.dataset.id,
              },
            });
            d.close();
            toast("已提交，编辑会核对后处理");
          });
        };
        return;
      }
      if (button.hasAttribute("data-like")) {
        if (!state.user) return login();
        const result = await api(
          `/api/comments/${encodeURIComponent(button.dataset.like)}/like`,
          { method: "POST", body: {} },
        );
        return toast(result.added ? "已点赞" : "你已点赞");
      }
      if (button.hasAttribute("data-delete-comment")) {
        await api(
          `/api/comments/${encodeURIComponent(button.dataset.deleteComment)}`,
          { method: "DELETE" },
        );
        button.closest(".comment").remove();
        return;
      }
      if (button.hasAttribute("data-more-comments")) {
        const data = await api(
          `/api/${button.dataset.type === "article" ? "articles" : "resources"}/${encodeURIComponent(button.dataset.id)}/comments?page=${button.dataset.page}`,
        );
        button.dataset.page = String(Number(button.dataset.page) + 1);
        button.insertAdjacentHTML(
          "beforebegin",
          data.items
            .map(
              (c) =>
                commentCard(c, state.user?.id),
            )
            .join(""),
        );
        if (data.items.length < 20) button.hidden = true;
        return;
      }
      if (
        button.hasAttribute("data-verify") ||
        button.hasAttribute("data-moderate")
      ) {
        if (!state.user) return login();
        const result = await api(
          `/api/${button.dataset.type === "article" ? "articles" : "resources"}/${encodeURIComponent(button.dataset.id)}`,
        );
        const forms = await import("./client/verification.js");
        return button.hasAttribute("data-verify")
          ? forms.verification(result.item, state.user)
          : forms.moderation(result.item);
      }
    } catch (error) {
      toast(error.message);
    }
  });
  document.querySelectorAll("[data-star-rating]").forEach((group) => {
    const choices = [...group.querySelectorAll(".rating-choice")];
    const current = () => Number(group.querySelector("input:checked")?.value || 0);
    const paint = (rating) => choices.forEach((choice, index) => choice.classList.toggle("is-selected", index < rating));
    const sync = () => {
      paint(current());
      group.querySelector("[data-rating-label]").textContent = current() ? current() + " / 5 星" : "点击星星评分";
      group.querySelector("[data-clear-rating]").hidden = !current();
    };
    choices.forEach((choice) => choice.addEventListener("pointerenter", () => paint(Number(choice.querySelector("input").value))));
    group.querySelector(".rating-options").addEventListener("pointerleave", () => paint(current()));
    group.addEventListener("change", sync);
    group.querySelector("[data-clear-rating]").onclick = () => {
      group.querySelectorAll("input").forEach((input) => { input.checked = false; });
      sync();
    };
    sync();
  });
  document.querySelectorAll("form[data-action]").forEach((form) =>
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!state.user) return login();
      submitSafely(form, async () => {
        await api(
          form.dataset.action === "comment" ? "/api/comments" : "/api/feedback",
          {
            method: "POST",
            body: {
              ...values(form),
              targetType: form.dataset.type,
              targetId: form.dataset.id,
              revision: Number(form.dataset.revision),
            },
          },
        );
        location.reload();
      });
    }),
  );
  if (state.detail?.public)
    api(
      `/api/${state.detail.type === "article" ? "articles" : "resources"}/${encodeURIComponent(state.detail.id)}/view`,
      { method: "POST", body: {} },
    ).catch(() => {});
  const workspace = document.querySelector("#workspace");
  if (state.privatePage && state.user && workspace?.querySelector(".loading")) {
    const name = {
      "/submit": "publish",
      "/profile": "profile",
      "/admin": "admin",
    }[state.privatePage];
    import(`./client/${name}.js`)
      .then((module) => module[name](workspace, state.user, state.query || {}))
      .catch((error) => {
        workspace.innerHTML = `<div class="notice"><h2>加载失败</h2><p>${e(error.message)}</p><button class="button secondary" id="retry-workspace">重新加载</button></div>`;
        workspace.querySelector("button").onclick = () => location.reload();
      });
  }
}
