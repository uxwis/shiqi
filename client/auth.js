import { api, modal, toast, submitSafely, values } from "./api.js";
import { verificationCodeButtonState } from "../shared/presentation.js";
let cooldown = 0;
export function login(mode = "login") {
  const register = mode === "register",
    reset = mode === "reset";
  const dialog = modal(
    `<span class="eyebrow">WELCOME TO SHIQI</span><h2>${register ? "一起共建 AI 资源社区" : reset ? "重置登录密码" : "欢迎回到拾器"}</h2><p class="dialog-description">发现值得复用的资源，记录属于你的实践。</p><form id="auth-form"><label>邮箱<input type="email" name="email" required autocomplete="email"></label>${register ? '<label>昵称<input name="nickname" required minlength="2" maxlength="20" autocomplete="nickname"></label>' : ""}${register || reset ? '<label>邮箱验证码<div class="inline-fields"><input name="code" required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code"><button class="button secondary" type="button" id="send-code">获取验证码</button></div></label>' : ""}<label>${reset ? "新密码" : "密码"}<input type="password" name="password" required minlength="10" maxlength="72" autocomplete="${register || reset ? "new-password" : "current-password"}" placeholder="至少 10 位，包含字母和数字"></label>${register ? '<label class="check"><input type="checkbox" name="agreement" required> 我已阅读并同意 <a href="/privacy" target="_blank">隐私与使用约定</a></label>' : ""}<button class="button full" type="submit">${register ? "注册并登录" : reset ? "重置密码" : "登录"}</button><p class="form-error" role="alert"></p></form><div class="auth-links"><button class="text-button" data-auth-mode="${register ? "login" : "register"}">${register ? "已有账号，登录" : "还没有账号？注册"}</button>${!reset ? '<button class="text-button" data-auth-mode="reset">忘记密码</button>' : '<button class="text-button" data-auth-mode="login">返回登录</button>'}</div>`,
  );
  dialog
    .querySelectorAll("[data-auth-mode]")
    .forEach((b) => (b.onclick = () => login(b.dataset.authMode)));
  const form = dialog.querySelector("form");
  form.onsubmit = (event) => {
    event.preventDefault();
    submitSafely(form, async () => {
      const data = values(form);
      if (register) data.agreement = !!data.agreement;
      await api("/api/auth/" + (reset ? "reset-password" : mode), {
        method: "POST",
        body: data,
      });
      if (reset) {
        toast("密码已重置，请重新登录");
        login();
      } else location.reload();
    });
  };
  const button = dialog.querySelector("#send-code");
  if (button) {
    const update = () => {
      const state = verificationCodeButtonState(cooldown);
      button.disabled = state.disabled;
      button.textContent = state.label;
    };
    update();
    button.onclick = () =>
      submitSafely(form, async () => {
        if (!form.elements.email.reportValidity()) return;
        button.disabled = true;
        try {
          const data = await api("/api/auth/request-code", {
            method: "POST",
            body: {
              email: form.elements.email.value,
              purpose: reset ? "reset" : "register",
            },
          });
          cooldown = Date.now() + 60000;
          if (data.developmentCode)
            toast("开发验证码：" + data.developmentCode);
          else toast("验证码已发送，请查收邮箱");
          const timer = setInterval(() => {
            update();
            if (!dialog.open || !button.isConnected || Date.now() >= cooldown)
              clearInterval(timer);
          }, 1000);
        } finally {
          update();
        }
      });
  }
}
