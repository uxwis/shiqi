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

export async function sendVerificationCode({ email, code, purpose }) {
  const transport = getTransporter();
  if (!transport) {
    if (config.production) throw new Error("生产环境尚未配置 SMTP 邮件服务");
    console.info(`[DEV EMAIL] ${email} ${purpose} verification code: ${code}`);
    return { delivered: false, developmentCode: code };
  }
  const subject = purpose === "reset" ? "拾器密码重置验证码" : "拾器注册验证码";
  await transport.sendMail({
    from: config.smtp.from,
    to: email,
    subject,
    text: `你的验证码是 ${code}，10 分钟内有效。若非本人操作，请忽略此邮件。`,
    html: `<p>你的验证码是 <strong style="font-size:22px;letter-spacing:3px">${code}</strong></p><p>10 分钟内有效。若非本人操作，请忽略此邮件。</p>`,
  });
  return { delivered: true };
}
