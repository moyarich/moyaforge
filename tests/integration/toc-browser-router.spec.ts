import { expect, test } from "@playwright/test";

test("host BrowserRouter keeps TOC deep links, active state and history synchronized", async ({
  page,
}) => {
  await page.goto("/app/toc-router");
  await expect(
    page.getByRole("heading", { name: "TOC router integration fixture" }),
  ).toBeVisible();

  const outline = page.locator("[data-moyaforge-doc-outline]");
  await expect(outline).toHaveCount(1);
  const first = outline.getByRole("link", { name: "First section" });
  const second = outline.getByRole("link", { name: "Second section" });
  await expect(first).toHaveAttribute("href", "#first-section");
  await expect(second).toHaveAttribute("href", "#second-section");

  await first.click();
  await expect(page).toHaveURL(/\/app\/toc-router#first-section$/);
  await expect(first).toHaveAttribute("aria-current", "location");

  await second.click();
  await expect(page).toHaveURL(/\/app\/toc-router#second-section$/);
  await expect(second).toHaveAttribute("aria-current", "location");
  await expect(first).not.toHaveAttribute("aria-current", "location");

  await page.goBack();
  await expect(page).toHaveURL(/\/app\/toc-router#first-section$/);
  await expect(first).toHaveAttribute("aria-current", "location");

  await page.goForward();
  await expect(page).toHaveURL(/\/app\/toc-router#second-section$/);
  await expect(second).toHaveAttribute("aria-current", "location");

  await page.reload();
  await expect(page).toHaveURL(/\/app\/toc-router#second-section$/);
  await expect(page.locator("#second-section")).toBeVisible();
});
