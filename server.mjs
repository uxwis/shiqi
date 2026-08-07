import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

const { config } = await import("./server/config.mjs");
const { startServer } = await import("./server/app.mjs");

try {
  const { server, database } = await startServer();
  console.log(`拾器服务已启动：${config.appOrigin}`);

  const shutdown = async signal => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await database.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
} catch (error) {
  console.error("服务启动失败：", error.message);
  process.exitCode = 1;
}
