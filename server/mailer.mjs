import nodemailer from "nodemailer";
import { config } from "./config.mjs";

let transporter;

function getTransporter() {
  if (!config.smtp.host) return null;
  transporter ||= nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.password } : undefined,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return transporter;
}

export async function sendWithZSend({ apiKey, baseUrl, from, to, subject, text, html, fetchImpl = fetch }) {
  const response = await fetchImpl(`${baseUrl}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Zeabur Email 发送失败（${response.status}）：${detail}`);
  }
}

export async function sendVerificationCode({ email, code, purpose }) {
  if (!config.email.provider) {
    if (config.production) throw new Error("生产环境尚未配置邮件服务");
    console.info(`[DEV EMAIL] ${email} ${purpose} verification code: ${code}`);
    return { delivered: false, developmentCode: code };
  }
  const subject = purpose === "reset" ? "拾器密码重置验证码" : "拾器注册验证码";
  const text = `你的验证码是 ${code}，10 分钟内有效。若非本人操作，请忽略此邮件。`;
  const html = `<p>你的验证码是 <strong style="font-size:22px;letter-spacing:3px">${code}</strong></p><p>10 分钟内有效。若非本人操作，请忽略此邮件。</p>`;
  if (config.email.provider === "zeabur") {
    await sendWithZSend({
      apiKey: config.email.zsendApiKey,
      baseUrl: config.email.zsendBaseUrl,
      from: config.email.from,
      to: email,
      subject,
      text,
      html,
    });
  } else {
    const transport = getTransporter();
    await transport.sendMail({ from: config.email.from, to: email, subject, text, html });
  }
  return { delivered: true };
}
