import { afterEach, expect, test } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, relative } from "node:path";
import { planItems, applyPlan } from "../packages/moyaforge-cli/src/registry.js";

const repository = resolve(import.meta.dirname, "..");
const roots = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
});

for (const name of ["docs-layout", "documentation-site", "monaco"]) {
  test(`registry installs ${name} independently with canonical source and CSS`, async () => {
    const root = await mkdtemp(resolve(tmpdir(), "moyaforge-ui-install-"));
    roots.push(root);
    const plan = await planItems({ root, names: [name], registry: repository });
    expect(plan.items).toEqual([name]);
    expect(plan.files.length).toBeGreaterThan(0);
    const paths = plan.files.map(file => relative(root, file.path).replaceAll("\\\\", "/"));
    expect(paths.some(path => path.endsWith(".tsx"))).toBe(true);
    expect(paths.some(path => path.endsWith(".css"))).toBe(true);
    expect(paths.every(path => path.startsWith("src/components/moyaforge/"))).toBe(true);
    expect(plan.files.every(file => !file.content.includes("packages/moyaforge/src/"))).toBe(true);
    await applyPlan(plan, { root });
    for (const file of plan.files) {
      expect(await readFile(file.path, "utf8")).toBe(file.content);
    }
    const repeat = await planItems({ root, names: [name], registry: repository });
    expect(repeat.files.every(file => file.previous === file.content)).toBe(true);
  });
}
