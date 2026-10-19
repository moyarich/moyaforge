import { test } from "@playwright/test";
import { verifyPackedConsumer } from "./packed-consumer-helper.js";

test.setTimeout(300_000);

test("existing app packed CLI consumer", async () => {
  await verifyPackedConsumer(
    { mode: "source", template: "existing", search: false },
    "existing-app",
  );
});
