import { defineConfig, devices } from "@playwright/test";

// Cổng cố định, tránh 3000 (Ducker ID) và 3100 (các game khác chạy song song).
const PORT = 3410;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Bản flag-on chạy bằng playwright.auth.config.ts (một build khác, cổng khác).
  testIgnore: "**/ducker-sign-in.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] }
    }
  ],
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    // Tính năng đăng nhập TẮT dù máy có .env bật cờ: biến của process thắng .env.
    env: { NEXT_PUBLIC_FEATURE_DUCKER_SIGN_IN: "false" },
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
