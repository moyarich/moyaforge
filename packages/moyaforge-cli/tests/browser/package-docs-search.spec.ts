import { test } from "@playwright/test";
import { verifyPackedConsumer } from "./packed-consumer-helper.js";

test("package docs search packed CLI consumer", async () => {
  await verifyPackedConsumer(
    { mode: "package", template: "docs", search: true },
    "package-docs-search",
  );
});
