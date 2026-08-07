import assert from "node:assert/strict";
import test from "node:test";
import { sendWithZSend } from "../server/mailer.mjs";

test("Zeabur Email uses bearer authentication and the expected payload", async () => {
  let request;
  await sendWithZSend({
    apiKey: "zs_test",
    baseUrl: "https://api.example.test/zsend",
    from: "no-reply@mail.example.com",
    to: "reader@example.com",
    subject: "验证码",
    text: "123456",
    html: "<strong>123456</strong>",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 202, text: async () => "" };
    },
  });

  assert.equal(request.url, "https://api.example.test/zsend/emails");
  assert.equal(request.options.headers.Authorization, "Bearer zs_test");
  assert.deepEqual(JSON.parse(request.options.body), {
    from: "no-reply@mail.example.com",
    to: ["reader@example.com"],
    subject: "验证码",
    text: "123456",
    html: "<strong>123456</strong>",
  });
});

test("Zeabur Email reports non-success responses", async () => {
  await assert.rejects(
    sendWithZSend({
      apiKey: "zs_test",
      baseUrl: "https://api.example.test/zsend",
      from: "no-reply@mail.example.com",
      to: "reader@example.com",
      subject: "验证码",
      text: "123456",
      html: "<strong>123456</strong>",
      fetchImpl: async () => ({ ok: false, status: 403, text: async () => "domain not verified" }),
    }),
    /Zeabur Email 发送失败（403）：domain not verified/,
  );
});
