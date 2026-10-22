import { test, expect } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  planItems,
  applyPlan,
} from "../../packages/moyaforge-cli/src/registry.ts";

test("reinstalling a registry item preserves user modifications by default", async () => {
  const repository = resolve(import.meta.dirname, "../..");
  const root = await mkdtemp(resolve(tmpdir(), "moyaforge-registry-repeat-"));
  try {
    const initial = await planItems({
      root,
      names: ["code-block"],
      registry: repository,
    });
    await applyPlan(initial, { root });
    const first = initial.files.find((file) =>
      file.path.endsWith("CodeBlock.tsx"),
    );
    expect(first).toBeDefined();
    await writeFile(first!.path, "// customized by the consumer\n");
    const repeated = await planItems({
      root,
      names: ["code-block"],
      registry: repository,
    });
    await applyPlan(repeated, { root });
    expect(await readFile(first!.path, "utf8")).toBe(
      "// customized by the consumer\n",
    );
    expect(repeated.files.some((file) => file.previous !== undefined)).toBe(
      true,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
