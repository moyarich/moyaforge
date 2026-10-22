import { test, expect } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, relative } from "node:path";
import {
  planItems,
  applyPlan,
} from "../../packages/moyaforge-cli/src/registry.ts";

test("each registry item installs independently at its declared targets", async () => {
  const repository = resolve(import.meta.dirname, "../..");
  const registry = JSON.parse(
    await readFile(resolve(repository, "registry.json"), "utf8"),
  );
  const root = await mkdtemp(resolve(tmpdir(), "moyaforge-registry-contract-"));
  try {
    for (const item of registry.items) {
      const plan = await planItems({
        root,
        names: [item.name],
        registry: repository,
      });
      expect(plan.items, item.name).toEqual([item.name]);
      expect(plan.files.length, item.name).toBeGreaterThan(0);
      for (const file of plan.files) {
        const target = relative(root, file.path).replaceAll("\\", "/");
        expect(target, item.name).toMatch(/^src\/components\/(?:ui|utils)\//);
        expect(target, item.name).not.toContain("/ui/components/");
      }
      await applyPlan(plan, { root });
      for (const file of plan.files)
        expect(await readFile(file.path, "utf8"), item.name).toBe(file.content);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
