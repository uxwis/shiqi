import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  retries: 0,
  reporter: "list",
  outputDir: ".tools/playwright-results",
  use: {
    baseURL: "http://127.0.0.1:4189",
    headless: true,
    channel:
      process.env.PLAYWRIGHT_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://127.0.0.1:4189/api/health",
    reuseExistingServer: false,
    env: { APP_ORIGIN: "http://127.0.0.1:4189", MAINTENANCE_ENABLED: "false" },
  },
});
