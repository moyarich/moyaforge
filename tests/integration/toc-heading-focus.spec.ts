import { expect, test } from "@playwright/test";

test("outline keyboard activation focuses its heading without losing the deep link", async ({
  page,
}) => {
  await page.goto("/app/toc-router");
  const link = page
    .locator("[data-moyaforge-doc-outline]")
    .getByRole("link", { name: "Second section" });

  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/app\/toc-router#second-section$/);
  await expect(page.locator("#second-section")).toBeFocused();
  await expect(link).toHaveAttribute("aria-current", "location");
});
