import { test } from "@playwright/test";
import { verifyPackedConsumer } from "./packed-consumer-helper.js";

test.setTimeout(300_000);

test("source docs packed CLI consumer", async () => {
  await verifyPackedConsumer(
    { mode: "source", template: "docs", search: false },
    "source-docs",
  );
});
