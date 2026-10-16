import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./e2e/extension", timeout: 30000, workers: 1, retries: 0, use: { trace: "retain-on-failure" } });
