import {
  test,
  preparePackedConsumer,
  verifyPackedConsumer,
  cleanupPackedConsumer,
  type PreparedConsumer,
} from "./packed-consumer-helper.js";

let consumer: PreparedConsumer;

test.beforeAll(async ({ packedArtifacts }) => {
  // Preparation is separate from the one-minute browser test timeout.
  test.setTimeout(10 * 60_000);
  consumer = await preparePackedConsumer(
    packedArtifacts,
    {"mode":"source","template":"existing","search":false},
    "existing-app",
  );
});

test.afterAll(async () => {
  await cleanupPackedConsumer(consumer);
});

test("existing app packed CLI consumer", async ({ page }) => {
  await verifyPackedConsumer(page, consumer);
});
