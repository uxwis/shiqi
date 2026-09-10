// Only Bilibili video identifiers are converted into the official embed URL.
export function bilibiliVideo(value) {
  let source = String(value || "").trim();
  if (source.startsWith("<iframe")) {
    source = source.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]?.replaceAll("&amp;", "&") || "";
  }
  if (/^BV[a-z0-9]{10}$/i.test(source) || /^av[1-9]\d{0,15}$/i.test(source))
    source = "https://www.bilibili.com/video/" + source;
  if (/^(www\.|m\.|player\.)?bilibili\.com\//i.test(source))
    source = "https://" + source;
  let url;
  try { url = new URL(source.startsWith("//") ? "https:" + source : source); }
  catch { throw new Error("请粘贴 B站视频完整链接、BV 号或官方嵌入代码"); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port ||
      !["bilibili.com", "www.bilibili.com", "m.bilibili.com", "player.bilibili.com"].includes(url.hostname))
    throw new Error("仅支持 B站视频链接，请使用 bilibili.com 的视频地址");
  let id;
  if (url.hostname === "player.bilibili.com" && url.pathname === "/player.html") {
    id = url.searchParams.get("bvid") || (url.searchParams.get("aid") ? "av" + url.searchParams.get("aid") : "");
  } else {
    id = url.pathname.match(/^\/video\/(BV[a-z0-9]{10}|av[1-9]\d{0,15})\/?$/i)?.[1];
  }
  if (!id || !/^(BV[a-z0-9]{10}|av[1-9]\d{0,15})$/i.test(id))
    throw new Error("未找到有效的视频编号，请粘贴含 BV 号的视频完整链接");
  id = id.slice(0, 2).toLowerCase() === "bv" ? "BV" + id.slice(2) : "av" + id.slice(2);
  const part = Number(url.searchParams.get("p") || url.searchParams.get("page") || 1);
  if (!Number.isInteger(part) || part < 1 || part > 1000) throw new Error("视频分 P 编号不正确");
  const query = new URLSearchParams({
    [id.startsWith("BV") ? "bvid" : "aid"]: id.startsWith("BV") ? id : id.slice(2),
    p: String(part), autoplay: "0", poster: "1",
  });
  return {
    src: "https://www.bilibili.com/video/" + id + "/" + (part > 1 ? "?p=" + part : ""),
    embed: "https://player.bilibili.com/player.html?" + query,
  };
}
