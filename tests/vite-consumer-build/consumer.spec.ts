import { expect, test } from "@playwright/test";

test("standalone consumer renders DocsLayout and canonical TOC links", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Consumer build fixture")).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "href",
    "#overview",
  );
});
