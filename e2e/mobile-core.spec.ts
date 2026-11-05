import { expect, test } from "@playwright/test";

async function waitForHomeChrome(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "פתח הגדרות שכבות מפה" })
  ).toBeVisible({ timeout: 30_000 });
}

async function waitForCitySheet(page: import("@playwright/test").Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await expect(
    dialog.getByRole("button", { name: "חזרה למפת האי" })
  ).toBeVisible();
  return dialog;
}

async function openCityHalfSheet(
  page: import("@playwright/test").Page,
  cityId: string
) {
  await page.goto(`/?city=${cityId}`);
  const dialog = await waitForCitySheet(page);
  const handle = dialog.locator("[data-sheet-grab] button").first();
  await handle.tap();
  await expect
    .poll(async () => (await dialog.boundingBox())?.height ?? 0)
    .toBeGreaterThan(300);
  return dialog;
}

test.describe("mobile touch core flows", () => {
  test("attraction list tap keeps place card in visible sheet (half)", async ({
    page,
  }) => {
    const dialog = await openCityHalfSheet(page, "taipei");
    const firstPlace = dialog
      .locator('[data-sheet-scroll] button')
      .filter({ hasText: "★" })
      .first();
    await expect(firstPlace).toBeVisible({ timeout: 15_000 });
    const placeName = (await firstPlace.innerText()).split("\n")[0]?.trim();
    await firstPlace.tap();

    const peekCard = page.locator("[data-place-peek-card]");
    await expect(peekCard).toBeVisible();
    await expect(peekCard.getByRole("link", { name: "פרטים" })).toBeVisible();
    if (placeName) {
      await expect(
        dialog.locator("button").filter({ hasText: placeName }).first()
      ).toBeVisible();
    }

    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.height ?? 0).toBeGreaterThan(280);

    if (process.env.SAVE_PR_SCREENSHOTS === "1") {
      await page.screenshot({
        path: "public/screenshots/after-v3-place-tap-half-390x844.png",
        fullPage: true,
      });
    }
  });

  test("deep link place opens readable card without collapsed peek", async ({
    page,
  }) => {
    await page.goto("/?city=taipei&place=attr-000-42986a");
    const dialog = await waitForCitySheet(page);
    await expect(dialog.getByRole("link", { name: "פרטים" })).toBeVisible({
      timeout: 15_000,
    });
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.height ?? 0).toBeGreaterThan(300);
    if (process.env.SAVE_PR_SCREENSHOTS === "1") {
      await page.screenshot({
        path: "public/screenshots/after-v3-deeplink-place-390x844.png",
        fullPage: true,
      });
    }
  });

  test("bottom nav opens food, hotels, and route pages", async ({ page }) => {
    await waitForHomeChrome(page);
    await page.getByRole("link", { name: "אוכל" }).tap();
    await expect(page).toHaveURL(/\/food/, { timeout: 15_000 });
    await page.getByRole("link", { name: "מלונות" }).tap();
    await expect(page).toHaveURL(/\/hotels/);
    await page.getByRole("link", { name: "מסלול" }).tap();
    await expect(page).toHaveURL(/\/route/);
  });

  test("philippines page renders with status badges on mobile", async ({
    page,
  }) => {
    await page.goto("/philippines");
    await expect(page.getByTestId("philippines-page")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("פיליפינים — מדריך הטיול")).toBeVisible();
    await expect(page.getByTestId("ph-status-verified").first()).toBeVisible();
    if (process.env.SAVE_PR_SCREENSHOTS === "1") {
      await page.screenshot({
        path: "public/screenshots/philippines-mobile-390x844.png",
        fullPage: true,
      });
    }
  });

  test("info tips page renders and back to map works", async ({ page }) => {
    await waitForHomeChrome(page);
    await page.getByRole("link", { name: "טיפים" }).tap();
    await expect(page).toHaveURL(/\/info/);
    await page.getByRole("link", { name: "מפה" }).tap();
    await expect(page).toHaveURL("/");
  });

  test("layers sheet opens with touch", async ({ page }) => {
    await waitForHomeChrome(page);
    await page.getByRole("button", { name: "פתח הגדרות שכבות מפה" }).tap();
    await expect(page.getByText("שכבות ותצוגת מפה")).toBeVisible();
    await page.getByRole("button", { name: "גרור למטה או הקש לסגירה" }).tap();
    await expect(page.getByText("שכבות ותצוגת מפה")).toBeHidden();
  });

  test("city back control returns to island map", async ({ page }) => {
    await page.goto("/?city=taipei");
    await waitForCitySheet(page);
    await page.getByRole("button", { name: "חזרה למפת האי" }).tap();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: "פתח הגדרות שכבות מפה" })
    ).toBeVisible();
  });

  test("scroll pages use safe-area layout shell", async ({ page }) => {
    await page.goto("/info");
    const shell = page.locator(".app-scroll-page").first();
    await expect(shell).toBeVisible({ timeout: 15_000 });
    const paddingTop = await shell.evaluate(
      (el) => parseFloat(getComputedStyle(el).paddingTop)
    );
    expect(paddingTop).toBeGreaterThanOrEqual(48);
  });

  test("scrollable list pages keep bottom nav reachable", async ({ page }) => {
    await page.goto("/food");
    await expect(page.getByPlaceholder("חפשו מנה, שוק לילה או שם בסינית...")).toBeVisible({
      timeout: 15_000,
    });
    const nav = page.getByRole("link", { name: "מפה" });
    await nav.scrollIntoViewIfNeeded();
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
  });
});
