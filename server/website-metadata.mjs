import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

// Public websites only. Validate every redirect and pin the connection to the
// checked DNS address so user-submitted URLs cannot reach internal services.
export function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0));
  }
  // Only globally routable IPv6 unicast; excludes mapped IPv4 and local ranges.
  return isIP(address) === 6 && /^[23]/i.test(address) && !/^2001:(?:0:|db8:|[12][0-9a-f]:)/i.test(address) && !/^2002:/i.test(address);
}

function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
    const named = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const number = entity[2].toLowerCase() === "x" ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : "";
  });
}

export function parseWebsiteMetadata(html, baseURL) {
  const meta = new Map();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = {};
    for (const attr of match[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attributes[attr[1].toLowerCase()] = decode(attr[2] ?? attr[3] ?? attr[4]);
    const key = (attributes.property || attributes.name || "").toLowerCase();
    if (!meta.has(key) && attributes.content) meta.set(key, attributes.content);
  }
  let image = "";
  try {
    const candidate = meta.get("og:image:secure_url") || meta.get("og:image") || "";
    const url = candidate ? new URL(candidate, baseURL) : null;
    if (url && ["http:", "https:"].includes(url.protocol) && !url.username && !url.password) image = url.href;
  } catch {}
  return { image, title: (meta.get("og:title") || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "")).slice(0, 200), description: (meta.get("og:description") || meta.get("description") || "").slice(0, 600) };
}

async function readWebsite(rawURL, signal, redirects = 0) {
  const url = new URL(rawURL);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || (url.port && !["80", "443"].includes(url.port))) throw new Error("Unsupported website URL");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some(entry => !isPublicAddress(entry.address))) throw new Error("Private website address");
  const address = addresses[0];
  const result = await new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      signal, agent: false,
      lookup: (_hostname, options, callback) => options.all ? callback(null, [address]) : callback(null, address.address, address.family),
      headers: { "User-Agent": "Shiqi-LinkPreview/1.0", Accept: "text/html", "Accept-Encoding": "identity" },
    }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume();
        resolve({ redirect: response.headers.location });
        return;
      }
      if (response.statusCode !== 200 || !/text\/html|application\/xhtml/i.test(response.headers["content-type"] || "")) { response.resume(); reject(new Error("No website metadata")); return; }
      let size = 0;
      const chunks = [];
      response.on("data", chunk => {
        size += chunk.length;
        if (size > 2 * 1024 * 1024) { response.destroy(new Error("Website too large")); return; }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ html: Buffer.concat(chunks).toString("utf8"), url: url.href }));
      response.on("error", reject);
    });
    request.on("error", reject);
    request.end();
  });
  if (result.redirect) {
    if (redirects >= 3) throw new Error("Too many redirects");
    return readWebsite(new URL(result.redirect, url).href, signal, redirects + 1);
  }
  return parseWebsiteMetadata(result.html, result.url);
}

export function createMetadataReader() {
  const cache = new Map();
  const waiting = [];
  let active = 0;
  const acquire = async () => {
    if (active < 8) { active++; return; }
    if (waiting.length >= 64) throw new Error("Metadata queue full");
    await new Promise(resolve => waiting.push(resolve));
  };
  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active--;
  };
  return async website => {
    const cached = cache.get(website);
    if (cached && cached.expires > Date.now()) return cached.promise;
    const entry = { expires: Date.now() + 24 * 60 * 60_000 };
    entry.promise = (async () => {
      await acquire();
      try { return await readWebsite(website, AbortSignal.timeout(8000)); }
      finally { release(); }
    })().catch(() => {
      entry.expires = Date.now() + 5 * 60_000;
      return { image: "", title: "", description: "" };
    });
    if (cache.size >= 1000) cache.delete(cache.keys().next().value);
    cache.set(website, entry);
    return entry.promise;
  };
}
