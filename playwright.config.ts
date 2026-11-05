import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    hasTouch: true,
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_E2E: "1",
    },
  },
  projects: [
    {
      name: "iphone-13",
      use: {
        browserName: "chromium",
        ...devices["iPhone 13"],
      },
    },
    {
      name: "pixel-7",
      use: {
        browserName: "chromium",
        ...devices["Pixel 7"],
      },
    },
    {
      name: "mobile-390x844",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "mobile-360x800",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 360, height: 800 },
      },
    },
  ],
});
