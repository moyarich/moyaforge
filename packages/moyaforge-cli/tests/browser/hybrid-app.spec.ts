import { test } from "@playwright/test";
import { verifyPackedConsumer } from "./packed-consumer-helper.js";

test.setTimeout(300_000);

test("hybrid app packed CLI consumer", async () => {
  await verifyPackedConsumer(
    { mode: "source", template: "hybrid", search: false },
    "hybrid-app",
  );
});
