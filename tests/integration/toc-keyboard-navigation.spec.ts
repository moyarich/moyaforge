import { expect, test } from "@playwright/test";

test("TOC links support keyboard navigation and keep the destination accessible", async ({
  page,
}) => {
  await page.goto("/app/toc-router");

  const outline = page.locator("[data-moyaforge-doc-outline]");
  const second = outline.getByRole("link", { name: "Second section" });
  await second.focus();
  await expect(second).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/app\/toc-router#second-section$/);
  await expect(second).toHaveAttribute("aria-current", "location");
  await expect(page.getByRole("heading", { name: "Second section" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/app\/toc-router#second-section$/);
  await expect(second).toHaveAttribute("aria-current", "location");
});
