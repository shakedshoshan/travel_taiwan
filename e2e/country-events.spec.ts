import { expect, test } from "@playwright/test";

test.describe("country switcher and events", () => {
  test("header switcher navigates between taiwan and philippines", async ({
    page,
  }) => {
    await page.goto("/");
    const switcher = page.getByTestId("country-switcher");
    await expect(switcher).toBeVisible({ timeout: 30_000 });
    await switcher.getByRole("link", { name: "פיליפינים" }).tap();
    await expect(page).toHaveURL(/\/philippines/, { timeout: 15_000 });
    await expect(switcher.getByRole("link", { name: "פיליפינים" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await switcher.getByRole("link", { name: "טייוואן" }).tap();
    await expect(page).toHaveURL("/", { timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: "פתח הגדרות שכבות מפה" })
    ).toBeVisible();
  });

  test("bottom nav has events tab and no philippines tab", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "אירועים" })).toBeVisible({
      timeout: 30_000,
    });
    const bottomNav = page.getByRole("navigation", { name: "ניווט ראשי" });
    await expect(bottomNav.getByRole("link", { name: "פיליפינים" })).toHaveCount(
      0
    );
  });

  test("events page shows taiwan events by default", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByTestId("events-page")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("events-page")).toHaveAttribute(
      "data-events-country",
      "taiwan"
    );
    await expect(page.getByRole("heading", { name: "אירועים מיוחדים" })).toBeVisible();
    await expect(page.getByTestId("tw-event-sold-out").first()).toBeVisible();
  });

  test("events page shows philippines events after country switch", async ({
    page,
  }) => {
    await page.goto("/philippines");
    await expect(page.getByTestId("philippines-page")).toBeVisible({
      timeout: 15_000,
    });
    await page.goto("/events");
    await expect(page.getByTestId("events-page")).toHaveAttribute(
      "data-events-country",
      "philippines"
    );
    await expect(page.getByTestId("ph-status-verified").first()).toBeVisible();
  });
});
