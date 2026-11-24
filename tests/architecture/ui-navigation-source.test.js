import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";
const registry = JSON.parse(
  await readFile(new URL("../../registry.json", import.meta.url), "utf8"),
);
test.each([
  ["navigation-tree", "NavigationTree"],
  ["sidebar-v1", "SidebarV1"],
  ["sidebar-v2", "SidebarV2"],
])(
  "%s includes its canonical source in private UI workspace",
  (name, folder) => {
    const item = registry.items.find((entry) => entry.name === name);
    expect(item).toBeDefined();
    const own = item.files.filter((entry) =>
      entry.path.startsWith(`packages/moyaforge-ui/src/components/${folder}/`),
    );
    expect(own.length).toBeGreaterThan(0);
    expect(own.some((entry) => entry.path.endsWith(".tsx"))).toBe(true);
  },
);

test.each(["navigation-tree", "sidebar-v1", "sidebar-v2"])(
  "%s installs its own UI source without framework component files",
  (name) => {
    const item = registry.items.find((entry) => entry.name === name);
    expect(item).toBeDefined();
    expect(
      item.files.filter((entry) =>
        entry.path.startsWith("packages/moyaforge/src/"),
      ),
    ).toEqual([]);
  },
);

test("sidebar-v1 does not require the MDX runtime package", () => {
  const item = registry.items.find((entry) => entry.name === "sidebar-v1");
  expect(
    item.dependencies.some((entry) =>
      entry.startsWith("@moyarich/moyaforge-mdx@"),
    ),
  ).toBe(false);
});

test("all UI-owned registry entries exclude framework implementation paths", () => {
  for (const item of registry.items) {
    if (
      !item.files.some((file) =>
        file.path.startsWith("packages/moyaforge-ui/src/"),
      )
    )
      continue;
    expect(
      item.files.filter((file) =>
        file.path.startsWith("packages/moyaforge/src/"),
      ),
      `framework source leaked into ${item.name}`,
    ).toEqual([]);
  }
});

test("the framework tarball excludes the standalone UI package", async () => {
  const framework = JSON.parse(
    await readFile(
      new URL("../../packages/moyaforge/package.json", import.meta.url),
      "utf8",
    ),
  );
  expect(framework.files).not.toContain("../moyaforge-ui");
  expect(framework.files.some((entry) => entry.includes("moyaforge-ui"))).toBe(
    false,
  );
});

