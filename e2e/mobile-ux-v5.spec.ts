import { expect, test } from "@playwright/test";

const ROUTES = [
  {
    path: "/",
    wait: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("button", { name: "פתח הגדרות שכבות מפה" })
      ).toBeVisible({ timeout: 30_000 });
    },
    tapScope: '[data-map-chrome="1"], nav[aria-label="ניווט ראשי"]',
  },
  {
    path: "/route",
    wait: async (page: import("@playwright/test").Page) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 15_000,
      });
    },
    tapScope: ".app-scroll-page, nav[aria-label='ניווט ראשי']",
  },
  {
    path: "/food",
    wait: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByPlaceholder("חפשו מנה, שוק לילה או שם בסינית...")
      ).toBeVisible({ timeout: 15_000 });
    },
    tapScope: ".app-scroll-page, nav[aria-label='ניווט ראשי']",
  },
  {
    path: "/hotels",
    wait: async (page: import("@playwright/test").Page) => {
      await expect(page.getByText(/השוואת .* מלונות/)).toBeVisible({
        timeout: 15_000,
      });
    },
    tapScope: ".app-scroll-page, nav[aria-label='ניווט ראשי']",
  },
  {
    path: "/info",
    wait: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", { name: "טיפים ומידע שימושי לטייוואן" })
      ).toBeVisible({ timeout: 15_000 });
    },
    tapScope: ".app-scroll-page, nav[aria-label='ניווט ראשי']",
  },
  {
    path: "/live-guide",
    wait: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", { name: "מדריך משולב — המלצות" })
      ).toBeVisible({ timeout: 15_000 });
    },
    tapScope: ".app-scroll-page, nav[aria-label='ניווט ראשי']",
  },
  {
    path: "/events",
    wait: async (page: import("@playwright/test").Page) => {
      await expect(page.getByTestId("events-page")).toBeVisible({
        timeout: 15_000,
      });
    },
    tapScope: ".app-scroll-page, nav[aria-label='ניווט ראשי']",
  },
  {
    path: "/philippines",
    wait: async (page: import("@playwright/test").Page) => {
      await expect(page.getByTestId("philippines-page")).toBeVisible({
        timeout: 15_000,
      });
    },
    tapScope: ".app-scroll-page, nav[aria-label='ניווט ראשי']",
  },
] as const;

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function assertTapTargets(
  page: import("@playwright/test").Page,
  scopeSelector: string
) {
  const tooSmall = await page.evaluate((scope) => {
    const roots = scope
      .split(",")
      .map((part) => part.trim())
      .flatMap((sel) => Array.from(document.querySelectorAll(sel)));
    const seen = new Set<Element>();
    const bad: string[] = [];
    for (const root of roots) {
      if (seen.has(root)) continue;
      seen.add(root);
      const nodes = root.querySelectorAll("a, button, summary, [role='button']");
      for (const node of nodes) {
        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (style.pointerEvents === "none") continue;
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        if (rect.width < 44 || rect.height < 44) {
          const label =
            node.getAttribute("aria-label") ||
            (node as HTMLElement).innerText?.slice(0, 40) ||
            node.tagName;
          bad.push(`${label} (${Math.round(rect.width)}×${Math.round(rect.height)})`);
        }
      }
    }
    return bad.slice(0, 12);
  }, scopeSelector);
  expect(tooSmall, tooSmall.join("; ")).toEqual([]);
}

test.describe("mobile ux v5 layout guards", () => {
  for (const route of ROUTES) {
    test(`no horizontal overflow on ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await route.wait(page);
      await assertNoHorizontalOverflow(page);
    });

    test(`tap targets on ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await route.wait(page);
      await assertTapTargets(page, route.tapScope);
    });
  }
});
