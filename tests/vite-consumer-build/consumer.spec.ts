import { expect, test } from "@playwright/test";

test("standalone consumer renders DocsLayout and distinct canonical TOC links", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Overview" })).toHaveCount(2);
  await expect(page.getByText("Consumer build fixture")).toBeVisible();
  const links = page.getByRole("link", { name: "Overview" });
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", "#overview");
  await expect(links.nth(1)).toHaveAttribute("href", "#overview-1");
});

test("TOC anchors are keyboard-accessible and preserve deep links", async ({
  page,
}) => {
  await page.goto("/");
  const secondLink = page.getByRole("link", { name: "Overview" }).nth(1);
  await secondLink.focus();
  await expect(secondLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#overview-1$/);
  await expect(page.locator("#overview-1")).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/#overview-1$/);
  await expect(page.locator("#overview-1")).toBeVisible();
});

test("TOC marks the active heading as current after hash navigation", async ({
  page,
}) => {
  await page.goto("/");
  const links = page.getByRole("link", { name: "Overview" });
  await links.nth(1).click();
  await expect(page).toHaveURL(/#overview-1$/);
  await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
  await expect(links.nth(0)).not.toHaveAttribute("aria-current", "location");

  await links.nth(0).click();
  await expect(page).toHaveURL(/#overview$/);
  await expect(links.nth(0)).toHaveAttribute("aria-current", "location");
  await expect(links.nth(1)).not.toHaveAttribute("aria-current", "location");
});

test("TOC navigation remains accessible at a narrow mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const outline = page.locator("[data-moyaforge-doc-outline]");
  await expect(outline).toHaveCount(1);
  const links = outline.getByRole("link", { name: "Overview" });
  await expect(links).toHaveCount(2);
  await links.nth(1).focus();
  await expect(links.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#overview-1$/);
  await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
});
