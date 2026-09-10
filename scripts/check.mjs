import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const files = ["app.js", "rich-text.js", "server.mjs", "playwright.config.mjs"];
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = directory + "/" + entry.name;
    if (entry.isDirectory()) await scan(path);
    else if (/\.(mjs|js)$/.test(path)) files.push(path);
  }
}
for (const dir of ["server", "client", "shared", "scripts", "tests"])
  await scan(dir);
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }
}
console.log(`Syntax checked ${files.length} JavaScript modules.`);
