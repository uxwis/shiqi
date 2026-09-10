import { api, modal, toast, submitSafely, values } from "./api.js";
import { options, field, area, failure } from "./forms.js";
export function verification(item, user) {
  const methods =
    user.role === "admin"
      ? [
          { id: "source_checked", name: "资料核对" },
          { id: "editor_tested", name: "编辑复测" },
          ...(user.id === item.userId
            ? [{ id: "author_tested", name: "作者自测" }]
            : []),
        ]
      : [{ id: "author_tested", name: "作者自测" }];
  const dialog = modal(
    `<h2>记录当前版本核验</h2><p class="dialog-description">仅对内容修订 v${item.revision} 生效。记录具体环境与结果，不将链接连通视为复现成功。</p><form><label>核验方式<select name="method">${options(methods)}</select></label>${field("environment", "版本与环境 *", "", 'required minlength="4" maxlength="1000"')}${area("evidence", "核验过程与证据说明 *", "", 'required minlength="10" maxlength="3000"')}${user.role === "admin" ? field("reviewDays", "下次复核间隔（天）", item.reviewDays || 30, 'type="number" min="1" max="90"') + area("reason", "调整周期的原因（修改周期时必填）") : ""}<button class="button" type="submit">保存核验记录</button>${failure}</form>`,
  );
  dialog.querySelector("form").onsubmit = (event) => {
    event.preventDefault();
    submitSafely(event.target, async () => {
      await api("/api/verifications", {
        method: "POST",
        body: {
          ...values(event.target),
          targetType: item.type,
          targetId: item.id,
          revision: item.revision,
        },
      });
      location.reload();
    });
  };
}
export function moderation(item) {
  const actions = [
    ["feature", "设为编辑精选"],
    ["unfeature", "取消精选"],
    ["review", "标记待复核"],
    ["broken", "确认失效并下架"],
    ["exclude", "确认非 AI 内容"],
    ["restore", "恢复为待复核"],
    ["admit", "确认纳入 AI 范围"],
  ].map(([id, name]) => ({ id, name }));
  const dialog = modal(
    `<h2>内容状态与精选</h2><p class="dialog-description">精选资格由服务端检查。恢复内容后需核验当前版本。</p><form><label>处理方式<select name="action">${options(actions)}</select></label>${area("reason", "处理说明 *", "", 'required minlength="4" maxlength="1000"')}${field("replacementURL", "替代方案链接（失效时可填）", "", 'type="url"')}<button type="submit" class="button">保存处理结果</button>${failure}</form>`,
  );
  dialog.querySelector("form").onsubmit = (event) => {
    event.preventDefault();
    submitSafely(event.target, async () => {
      await api(
        `/api/admin/${item.type === "article" ? "articles" : "resources"}/${encodeURIComponent(item.id)}/moderate`,
        {
          method: "POST",
          body: { ...values(event.target), revision: item.revision },
        },
      );
      location.reload();
    });
  };
}
