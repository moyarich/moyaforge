import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "../fixture/registry-generator.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("includes registry setup guides as metadata without installing them", async () => {
  const { root, put } = await fixture();
  const guide =
    "## Setup\n\nInstall the host dependencies and configure workers.\n";
  await put("registry/docs/new-badge.md", guide);
  const generated = await buildRegistry(root);
  const item = generated.items.find((item) => item.name === "new-badge");
  expect(item.docs).toBe(guide);
  expect(item.files.some((file) => file.path.endsWith("README.md"))).toBe(
    false,
  );
  expect(item.files.some((file) => file.path === "LICENSE")).toBe(false);
  await buildRegistry(root, { check: true });
  await put("registry/docs/new-badge.md", "Changed setup requirements.\n");
  await expect(buildRegistry(root, { check: true })).rejects.toThrow(
    "Registry is stale",
  );
});
