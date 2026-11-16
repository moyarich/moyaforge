import { expect, test } from "@playwright/test";

test("real React Monaco and TypeFox share VS Code workers without startup conflicts", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /monaco|worker|vscode|languageclient|language server/i.test(message.text())
    ) failures.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (/worker/i.test(request.url()) && !/ERR_ABORTED/.test(request.failure()?.errorText ?? "")) {
      failures.push(`Worker request failed: ${request.url()}: ${request.failure()?.errorText}`);
    }
  });

  await page.goto("/app/monaco-shared", { timeout: 90_000 });
  await expect(page.getByRole("heading", { name: "Shared Monaco browser fixture" })).toBeVisible();
  await expect(page.getByTestId("react-ready")).toHaveText("ready", { timeout: 60_000 });
  await expect(page.getByTestId("typefox-ready")).toHaveText("ready", { timeout: 60_000 });

  const react = page.getByTestId("react-editor");
  const typefox = page.getByTestId("typefox-editor");
  const reactLines = react.locator(".monaco-editor .view-lines").first();
  const typefoxLines = typefox.locator(".monaco-editor .view-lines").first();

  await expect(reactLines).toContainText("React Monaco ready");
  await expect(typefoxLines).toContainText("TypeFox Monaco ready");

  await react.getByRole("tab", { name: "styles.css" }).click();
  await expect(reactLines).toContainText("royalblue");
  await react.getByRole("tab", { name: "ReactView.tsx" }).click();
  await expect(reactLines).toContainText("React Monaco ready");

  await typefox.getByRole("tab", { name: "settings.json" }).click();
  await expect(typefoxLines).toContainText("enabled", { timeout: 60_000 });
  await typefox.getByRole("tab", { name: "TypeFoxView.tsx" }).click();
  await expect(typefoxLines).toContainText("TypeFox Monaco ready", { timeout: 60_000 });

  await expect(page.locator('main > p[role="alert"], [data-moyaforge-monaco-workspace] p[role="alert"]')).toHaveCount(0);
  expect(failures).toEqual([]);
});
