import { test } from "@playwright/test";
import { verifyPackedConsumer } from "./packed-consumer-helper.js";

test("existing app packed CLI consumer", async () => {
  await verifyPackedConsumer({"mode":"source","template":"existing","search":false}, "existing-app");
}, { timeout: 300_000 });
