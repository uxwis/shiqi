import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { startLocalPostgres } from "./local-postgres.mjs";
const directory = await mkdtemp(join(tmpdir(), "shiqi-pg17-test-"));
const postgres = await startLocalPostgres({
  directory,
  databaseName: "shiqi_test",
});
console.log("Real PostgreSQL " + postgres.version);
try {
  const files = process.argv.slice(2);
  const child = spawn(
    process.execPath,
    [
      "--test",
      "--test-concurrency=1",
      ...(files.length
        ? files
        : ["tests/api.test.mjs", "tests/community.test.mjs"]),
    ],
    {
      stdio: "inherit",
      windowsHide: true,
      env: { ...process.env, TEST_DATABASE_URL: postgres.url },
    },
  );
  process.exitCode = await new Promise((resolve, reject) => {
    child.on("exit", resolve);
    child.on("error", reject);
  });
} finally {
  await postgres.close();
}
