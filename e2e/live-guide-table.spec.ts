import { expect, test } from "@playwright/test";

test.describe("live guide combined table (mobile)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/live-guide");
    await expect(
      page.getByRole("heading", { name: "מדריך משולב — המלצות" })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("shows filtered count and Mizrahnik-only rows when source filter is set", async ({
    page,
  }) => {
    const count = page.getByTestId("live-guide-count");
    await expect(count).toContainText("מציג 328 מתוך 328");

    await page.getByTestId("live-guide-source").selectOption("mizrahnik");
    await expect(count).toContainText("מציג 86");

    const visibleRows = page
      .getByTestId("live-guide-row")
      .filter({ visible: true });
    await expect(visibleRows.first()).toBeVisible();
    await expect(visibleRows).toHaveCount(86);

    const sampleTag = page.getByText("מזרחניק").first();
    await expect(sampleTag).toBeVisible();
  });

  test("status group filter סגור and reset clears filters", async ({
    page,
  }) => {
    await page.getByTestId("live-guide-status").selectOption("closed_limited");
    const count = page.getByTestId("live-guide-count");
    await expect(count).not.toContainText("מציג 0 מתוך 328");

    await page.getByRole("button", { name: "איפוס מסננים" }).click();
    await expect(count).toContainText("מציג 328 מתוך 328");
  });

  test("free-text search can reach empty state then reset", async ({
    page,
  }) => {
    await page.getByTestId("live-guide-search").fill("zzzznomatchzzzz");
    await expect(page.getByTestId("live-guide-empty")).toBeVisible();
    await expect(page.getByTestId("live-guide-count")).toContainText(
      "מציג 0 מתוך 328"
    );

    await page.getByRole("button", { name: "איפוס מסננים" }).click();
    await expect(page.getByTestId("live-guide-count")).toContainText(
      "מציג 328 מתוך 328"
    );
  });
});
