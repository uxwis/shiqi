import test from "node:test";
import assert from "node:assert/strict";
import { verificationCodeButtonState } from "../app.js";

test("verification code button stays disabled for the cooldown", () => {
  const now = 1_000_000;

  assert.deepEqual(verificationCodeButtonState(now + 60_000, now), {
    disabled: true,
    label: "60 秒后重试",
    remaining: 60,
  });
  assert.deepEqual(verificationCodeButtonState(now + 1, now), {
    disabled: true,
    label: "1 秒后重试",
    remaining: 1,
  });
});

test("verification code button is restored when the cooldown ends", () => {
  const now = 1_000_000;

  assert.deepEqual(verificationCodeButtonState(now, now), {
    disabled: false,
    label: "获取验证码",
    remaining: 0,
  });
});
