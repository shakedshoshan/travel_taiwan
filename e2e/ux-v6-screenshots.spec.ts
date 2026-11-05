import { expect, test } from "@playwright/test";
import path from "node:path";

const OUT = path.join("public", "screenshots", "ux-v6");

test.describe("ux-v6 screenshots", () => {
  test("capture header switcher and events pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("country-switcher")).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({
      path: path.join(OUT, "after-header-switcher-390x844.png"),
      fullPage: false,
    });

    await page.goto("/events");
    await expect(page.getByTestId("events-page")).toHaveAttribute(
      "data-events-country",
      "taiwan"
    );
    await page.screenshot({
      path: path.join(OUT, "after-events-taiwan-390x844.png"),
      fullPage: true,
    });

    await page.goto("/philippines");
    await expect(page.getByTestId("philippines-page")).toBeVisible({
      timeout: 15_000,
    });
    await page.goto("/events");
    await expect(page.getByTestId("events-page")).toHaveAttribute(
      "data-events-country",
      "philippines"
    );
    await page.screenshot({
      path: path.join(OUT, "after-events-philippines-390x844.png"),
      fullPage: true,
    });
  });
});
