import { expect, test } from "@playwright/test";
import path from "node:path";

const OUT_DIR = path.join("public", "screenshots", "ux-v4");

async function waitForHomeChrome(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "פתח הגדרות שכבות מפה" })
  ).toBeVisible({ timeout: 30_000 });
}

test.describe("ux-v4 screenshot capture", () => {
  test("main mobile screens", async ({ page }) => {
    const phase = process.env.UX_SCREENSHOT_PHASE === "before" ? "before" : "after";
    const shot = (name: string) =>
      page.screenshot({
        path: path.join(OUT_DIR, `${phase}-${name}-390x844.png`),
        fullPage: true,
      });

    await waitForHomeChrome(page);
    await shot("home");

    await page.goto("/?city=taipei");
    await expect(page.getByText("עיר נוכחית")).toBeVisible({ timeout: 20_000 });
    await shot("city-sheet-peek");

    const dialog = page.getByRole("dialog");
    await dialog.locator("[data-sheet-grab] button").first().tap();
    await expect
      .poll(async () => (await dialog.boundingBox())?.height ?? 0)
      .toBeGreaterThan(300);
    await shot("city-sheet-half");

    await page.goto("/route");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await shot("route");

    await page.goto("/food");
    await expect(
      page.getByPlaceholder("חפשו מנה, שוק לילה או שם בסינית...")
    ).toBeVisible({ timeout: 15_000 });
    await shot("food");

    await page.goto("/hotels");
    await expect(page.getByText(/השוואת .* מלונות/)).toBeVisible({
      timeout: 15_000,
    });
    await shot("hotels");

    await page.goto("/info");
    await expect(
      page.getByRole("heading", { name: "טיפים ומידע שימושי לטייוואן" })
    ).toBeVisible({ timeout: 15_000 });
    await shot("info");

    await page.goto("/philippines");
    await expect(page.getByTestId("philippines-page")).toBeVisible({
      timeout: 15_000,
    });
    await shot("philippines");

    await page.goto("/");
    await waitForHomeChrome(page);
    await page.getByRole("button", { name: "פתח הגדרות שכבות מפה" }).tap();
    await expect(page.getByText("שכבות ותצוגת מפה")).toBeVisible();
    await shot("layers-sheet");
  });
});
