import { expect, test } from "@playwright/test";

test("consumer outline slot replaces the default outline without breaking anchors", async ({
  page,
}) => {
  await page.goto("/app/toc-router?custom-outline");

  const custom = page.locator("[data-custom-outline]");
  await expect(custom).toHaveCount(1);
  await expect(page.locator("[data-moyaforge-doc-outline]")).toHaveCount(0);

  const link = custom.getByRole("link", { name: "Custom second section" });
  await link.click();
  await expect(page).toHaveURL(/\/app\/toc-router\?custom-outline#second-section$/);
  await expect(page.locator("#second-section")).toBeVisible();
});
