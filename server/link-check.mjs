import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isPublicAddress } from "./public-address.mjs";

export function createLinkChecker({ resolve = lookup, transport } = {}) {
  async function visit(raw, signal, method = "HEAD", hops = 0) {
    const url = new URL(raw);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && !["80", "443"].includes(url.port))
    )
      throw new Error("unsafe");
    signal.throwIfAborted();
    let abort;
    const timeout = new Promise((_, reject) => {
      abort = () => reject(new Error("timeout"));
      signal.addEventListener("abort", abort, { once: true });
    });
    let addresses;
    try {
      addresses = await Promise.race([
        resolve(url.hostname.replace(/^\[|\]$/g, ""), { all: true }),
        timeout,
      ]);
    } finally {
      signal.removeEventListener("abort", abort);
    }
    signal.throwIfAborted();
    if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
      throw new Error("unsafe");
    const address = addresses[0];
    const result = transport
      ? await transport(url, { method, address, signal })
      : await new Promise((resolve, reject) => {
          const request = (
            url.protocol === "https:" ? httpsRequest : httpRequest
          )(
            url,
            {
              method,
              signal,
              agent: false,
              lookup: (_host, options, callback) =>
                options.all
                  ? callback(null, [address])
                  : callback(null, address.address, address.family),
              headers: {
                "User-Agent": "Shiqi-LinkCheck/2.0",
                "Accept-Encoding": "identity",
                ...(method === "GET" ? { Range: "bytes=0-2047" } : {}),
              },
            },
            (response) => {
              // Reading the status and headers is sufficient. Never stream resource files.
              resolve({
                status: response.statusCode,
                location: response.headers.location,
              });
              response.destroy();
            },
          );
          request.on("error", reject);
          request.end();
        });
    if ([301, 302, 303, 307, 308].includes(result.status)) {
      if (hops >= 3 || !result.location) throw new Error("redirect");
      const next = new URL(result.location, url);
      if (/\/(login|signin|sign-in|auth)(?:\/|\?|$)/i.test(next.pathname))
        return { status: result.status, login: true };
      return visit(next.href, signal, method, hops + 1);
    }
    if (method === "HEAD" && [405, 501].includes(result.status))
      return visit(url.href, signal, "GET", hops);
    return result;
  }
  return async (raw) => {
    try {
      const result = await visit(raw, AbortSignal.timeout(8000));
      const status = result.status;
      if (result.login)
        return {
          status: "needs_check",
          httpStatus: status,
          note: "需要登录，等待人工核对",
        };
      if (status >= 200 && status < 300)
        return {
          status: "ok",
          httpStatus: status,
          note: "入口可访问；未验证内容效果",
        };
      if ([404, 410].includes(status))
        return {
          status: "missing",
          httpStatus: status,
          note: "入口疑似不存在，等待再次检查及人工确认",
        };
      return {
        status: "needs_check",
        httpStatus: status,
        note: [401, 403].includes(status)
          ? "访问受限或需要登录"
          : status === 429
            ? "请求受限，稍后重试"
            : "服务响应异常，等待人工核对",
      };
    } catch (error) {
      return {
        status: error.message === "unsafe" ? "unsafe" : "needs_check",
        httpStatus: null,
        note:
          error.message === "unsafe"
            ? "已阻止内网地址、危险协议或端口"
            : "请求超时或跳转异常，等待人工核对",
      };
    }
  };
}
