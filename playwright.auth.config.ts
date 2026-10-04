import { defineConfig, devices } from "@playwright/test";

/**
 * Bản chạy có cờ đăng nhập Ducker ID BẬT, với issuer giả `http://ducker.test`
 * (không bao giờ phân giải — mọi request tới nó đều bị page.route chặn).
 * Tách khỏi playwright.config.ts vì hai server `next dev` không được dùng chung
 * thư mục .next; `pnpm test:e2e` chạy lần lượt cả hai.
 */
const PORT = 3411;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/ducker-sign-in.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } }
  ],
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_BASE_PATH: "",
      NEXT_PUBLIC_FEATURE_DUCKER_SIGN_IN: "true",
      NEXT_PUBLIC_DUCKER_ISSUER: "http://ducker.test",
      NEXT_PUBLIC_DUCKER_CLIENT_ID: "e2e-client",
      NEXT_PUBLIC_DUCKER_SCOPE: "openid profile email",
      NEXT_PUBLIC_DUCKER_PROFILE_PATH: "/profile"
    }
  }
});
