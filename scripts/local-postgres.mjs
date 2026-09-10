import { mkdir, mkdtemp, cp, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:net";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import pg from "pg";

const run = promisify(execFile);
export async function startLocalPostgres({ directory, databaseName }) {
  if (!/^[a-z][a-z0-9_]+$/.test(databaseName))
    throw new Error("Invalid local database name");
  await mkdir(directory, { recursive: true });
  const { default: getBinaries } = await import(
    new URL("./binary.js", import.meta.resolve("embedded-postgres"))
  );
  const binaries = await getBinaries();
  // Keep the native installation in an ASCII path; Windows initdb otherwise
  // misinterprets package paths containing Chinese characters under UTF-8.
  const native = await mkdtemp(join(tmpdir(), "shiqi-pg17-native-"));
  await cp(dirname(dirname(binaries.postgres)), native, { recursive: true });
  const bin = join(native, "bin"),
    suffix = process.platform === "win32" ? ".exe" : "";
  const data = join(directory, "data");
  const options = {
    windowsHide: true,
    cwd: native,
    env: { ...process.env, LC_ALL: "C", LC_MESSAGES: "C" },
  };
  const initialized = await access(join(data, "PG_VERSION")).then(
    () => true,
    () => false,
  );
  if (!initialized)
    await run(
      join(bin, "initdb" + suffix),
      [
        "-D",
        data,
        "-U",
        "postgres",
        "-E",
        "UTF8",
        "--locale=C",
        "--auth=trust",
      ],
      options,
    );
  const socket = createServer();
  await new Promise((r) => socket.listen(0, "127.0.0.1", r));
  const port = socket.address().port;
  await new Promise((r) => socket.close(r));
  let logs = "";
  const processHandle = spawn(
    join(bin, "postgres" + suffix),
    ["-D", data, "-h", "127.0.0.1", "-p", String(port)],
    { ...options, stdio: ["ignore", "pipe", "pipe"] },
  );
  processHandle.stderr.on("data", (chunk) => {
    logs = (logs + chunk).slice(-12000);
  });
  processHandle.stdout.on("data", (chunk) => {
    logs = (logs + chunk).slice(-12000);
  });
  let spawnError;
  processHandle.on("error", (error) => {
    spawnError = error;
  });
  const close = () =>
    run(
      join(bin, "pg_ctl" + suffix),
      ["-D", data, "stop", "-m", "fast", "-w"],
      options,
    );
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      const client = new pg.Client({
        host: "127.0.0.1",
        port,
        user: "postgres",
        database: "postgres",
        connectionTimeoutMillis: 300,
      });
      try {
        await client.connect();
        const version = (await client.query("SHOW server_version")).rows[0]
          .server_version;
        if (!version.startsWith("17."))
          throw new Error("PostgreSQL 17 required");
        if (
          !(
            await client.query(
              "SELECT datname FROM pg_database WHERE datname=$1",
              [databaseName],
            )
          ).rows.length
        )
          await client.query(`CREATE DATABASE ${databaseName}`);
        return {
          url: `postgres://postgres@127.0.0.1:${port}/${databaseName}`,
          version,
          close,
        };
      } catch (error) {
        if (processHandle.exitCode !== null)
          throw new Error(logs || error.message);
        if (attempt === 99) throw error;
        await new Promise((r) => setTimeout(r, 100));
      } finally {
        await client.end().catch(() => {});
      }
    }
    throw new Error("Local PostgreSQL did not become ready");
  } catch (error) {
    await close().catch(() => {});
    throw error;
  }
}
