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
    {"mode":"source","template":"docs","search":false},
    "source-docs",
  );
});

test.afterAll(async () => {
  await cleanupPackedConsumer(consumer);
});

test("source docs packed CLI consumer", async ({ page }) => {
  await verifyPackedConsumer(page, consumer);
});
