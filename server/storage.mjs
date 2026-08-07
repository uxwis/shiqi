import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { config } from "./config.mjs";

const IMAGE_TYPES = {
  jpeg: { extension: "jpg", magic: buffer => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  png: { extension: "png", magic: buffer => buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])) },
  webp: { extension: "webp", magic: buffer => buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP" },
};

export async function storeImageDataURL(dataURL) {
  if (config.upload.driver !== "local") throw new Error(`暂不支持的上传驱动：${config.upload.driver}`);
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataURL || ""));
  if (!match) throw Object.assign(new Error("仅支持 JPG、PNG 或 WebP 图片"), { statusCode: 400 });
  const type = IMAGE_TYPES[match[1]];
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > config.upload.maxImageBytes) throw Object.assign(new Error("图片大小超出限制"), { statusCode: 413 });
  if (!type.magic(buffer)) throw Object.assign(new Error("图片文件内容与格式不匹配"), { statusCode: 400 });
  await mkdir(config.upload.directory, { recursive: true });
  const filename = `${randomUUID()}.${type.extension}`;
  await writeFile(join(config.upload.directory, filename), buffer, { flag: "wx" });
  return `${config.upload.publicPath.replace(/\/$/, "")}/${filename}`;
}
