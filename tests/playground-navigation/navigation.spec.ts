import { expect, test } from "@playwright/test";

test("sidebar links navigate to rendered playground pages", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/#/docs");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  // Exercise actual navigation links instead of only loading routes directly.
  const routes = await page.locator('a[href*="#/"]:visible').evaluateAll((links) =>
    [...new Set(links.map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href && /^#\/(?:docs|ui|packages)(?:\/|$)/.test(href))))]
      .slice(0, 8),
  );
  expect(routes.length).toBeGreaterThan(0);

  for (const href of routes) {
    await page.goto("/#/docs");
    // Click the concrete anchor so the router runs rather than directly visiting the URL.
    const target = page.locator(`a[href="${href}"]:visible`).first();
    await target.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}import { expect, test } from "@playwright/test";

test("sidebar links navigate to rendered playground pages", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/#/docs");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  // Exercise actual navigation links instead of only loading routes directly.
  const routes = await page.locator('a[href*="#/"]:visible').evaluateAll((links) =>
    [...new Set(links.map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href && /^#\/(?:docs|ui|packages)(?:\/|$)/.test(href))))]
      .slice(0, 8),
  );
  expect(routes.length).toBeGreaterThan(0);

  for (const href of routes) {
    await page.goto("/#/docs");
    // Click the concrete anchor so the router runs rather than directly visiting the URL.
    const target = page.locator(`a[href="${href}"]:visible`).first();
    await target.click();
    await expect(page).));
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Page not found" })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("warning documentation route renders and preserves browser history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/#/docs");
  await page.goto("/#/ui/components/custom-block/warning");
  await expect(page.getByRole("heading", { name: "Warning", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page not found" })).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/#\/docs$/);
  await page.goForward();
  await expect(page).toHaveURL(/#\/ui\/components\/custom-block\/warning$/);
  await expect(page.getByRole("heading", { name: "Warning", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
