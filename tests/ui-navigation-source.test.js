import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";
const registry = JSON.parse(
  await readFile(new URL("../registry.json", import.meta.url), "utf8"),
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

test("sidebar-v1 carries its structural navigation type without importing MDX", async () => {
  const item = registry.items.find((entry) => entry.name === "sidebar-v1");
  const typePath = "packages/moyaforge-ui/src/components/SidebarV1/types.ts";
  expect(item.files.some((entry) => entry.path === typePath)).toBe(true);

  for (const filename of ["Navigation.tsx", "SidebarV1.tsx"]) {
    const source = await readFile(
      new URL(
        `../packages/moyaforge-ui/src/components/SidebarV1/${filename}`,
        import.meta.url,
      ),
      "utf8",
    );
    expect(source).toContain('from "./types.js"');
    expect(source).not.toContain("@moyarich/moyaforge-mdx");
    expect(source).not.toContain("packages/moyaforge/");
  }
});

test("sidebar-v2 retains its Page source dependency in the installable registry", () => {
  const item = registry.items.find((entry) => entry.name === "sidebar-v2");
  const paths = new Set(item.files.map((entry) => entry.path));
  expect(
    paths.has("packages/moyaforge-ui/src/components/SidebarV2/Sidebar.tsx"),
  ).toBe(true);
  expect(paths.has("packages/moyaforge-ui/src/components/Page/index.ts")).toBe(
    true,
  );
});
