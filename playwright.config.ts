import { defineConfig, devices } from "@playwright/test";

const PORT = 3100; // not 3000, so it never collides with a running dev server

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`, // production build, not dev
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 240_000
  }
});
