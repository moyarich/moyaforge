import { expect, test } from "@playwright/test";

test("host HashRouter preserves TOC fragment navigation and history", async ({
  page,
}) => {
  await page.goto("/?hash-router#/app/toc-router");
  await expect(
    page.getByRole("heading", { name: "TOC router integration fixture" }),
  ).toBeVisible();

  const outline = page.locator("[data-moyaforge-doc-outline]");
  const first = outline.getByRole("link", { name: "First section" });
  const second = outline.getByRole("link", { name: "Second section" });

  await first.click();
  await expect(page).toHaveURL(/#\/app\/toc-router#first-section$/);
  await expect(first).toHaveAttribute("aria-current", "location");

  await second.click();
  await expect(page).toHaveURL(/#\/app\/toc-router#second-section$/);
  await expect(second).toHaveAttribute("aria-current", "location");

  await page.goBack();
  await expect(page).toHaveURL(/#\/app\/toc-router#first-section$/);
  await expect(first).toHaveAttribute("aria-current", "location");

  await page.goForward();
  await expect(page).toHaveURL(/#\/app\/toc-router#second-section$/);
  await expect(second).toHaveAttribute("aria-current", "location");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Second section" })).toBeVisible();
  await expect(second).toHaveAttribute("aria-current", "location");
});
