import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "./fixture.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("styles follow component imports without collecting unused siblings or aggregate entries", async () => {
  const { root, put } = await fixture();
  await put(
    "packages/moyaforge-ui/src/components/Nested/NewBadge/unused.css",
    "body { color: red; }",
  );
  const { items } = await buildRegistry(root);
  const item = items.find((item) => item.name === "new-badge");
  expect(item.files.some((file) => file.path.endsWith("badge.css"))).toBe(true);
  expect(item.files.some((file) => file.path.endsWith("tokens.css"))).toBe(
    true,
  );
  expect(item.files.some((file) => file.path.endsWith("unused.css"))).toBe(
    false,
  );
  expect(
    item.files.some((file) => file.path.startsWith("registry/styles/")),
  ).toBe(false);
  await expect(
    readFile(resolve(root, "registry/styles/new-badge.css")),
  ).rejects.toThrow();
});
