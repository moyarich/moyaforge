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

test("docs-layout installs as a standalone React component", async () => {
  const item = registry.items.find((entry) => entry.name === "docs-layout");
  expect(item).toBeDefined();
  expect(item.dependencies).toEqual(["react@>=18"]);
  expect(
    item.files.filter((entry) =>
      entry.path.startsWith("packages/moyaforge/src/"),
    ),
  ).toEqual([]);
  expect(
    item.files.some(
      (entry) =>
        entry.path ===
        "packages/moyaforge-ui/src/components/Layout/DocsLayout/DocsLayout.css",
    ),
  ).toBe(true);
  const source = await readFile(
    new URL(
      "../packages/moyaforge-ui/src/components/Layout/DocsLayout/DocsLayout.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  expect(source).not.toContain("@moyarich/moyaforge-mdx");
  expect(source).not.toContain("react-router-dom");
});

test("documentation-site installs independently of framework routing and DocsLayout", async () => {
  const item = registry.items.find(
    (entry) => entry.name === "documentation-site",
  );
  expect(item).toBeDefined();
  expect(item.dependencies).toEqual(["react@>=18"]);
  expect(
    item.files.filter((entry) =>
      entry.path.startsWith("packages/moyaforge/src/"),
    ),
  ).toEqual([]);
  const paths = item.files.map((entry) => entry.path);
  expect(paths).toContain(
    "packages/moyaforge-ui/src/components/Layout/DocumentationSite/DocumentationSite.tsx",
  );
  expect(paths).not.toContain(
    "packages/moyaforge-ui/src/components/Layout/DocsLayout/DocsLayout.tsx",
  );
  const source = await readFile(
    new URL(
      "../packages/moyaforge-ui/src/components/Layout/DocumentationSite/DocumentationSite.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  expect(source).not.toContain("@moyarich/moyaforge-mdx");
  expect(source).not.toContain("react-router-dom");
  expect(source).not.toContain("useContentRouting");
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

test("the UI workspace remains private and is not an npm-distributed component bundle", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../packages/moyaforge-ui/package.json", import.meta.url),
      "utf8",
    ),
  );
  expect(manifest.private).toBe(true);
  const framework = JSON.parse(
    await readFile(
      new URL("../packages/moyaforge/package.json", import.meta.url),
      "utf8",
    ),
  );
  expect(framework.files).not.toContain("../moyaforge-ui");
  expect(framework.files.some((entry) => entry.includes("moyaforge-ui"))).toBe(
    false,
  );
});

test("documentation-site registry metadata matches generator conventions", () => {
  const item = registry.items.find(
    (entry) => entry.name === "documentation-site",
  );
  expect(item.description).toBe(
    "Editable MoyaForge documentation-site source and CSS. Import the installed styles alongside the component.",
  );
});

test("framework publishes its stylesheet once from dist", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../packages/moyaforge/package.json", import.meta.url),
      "utf8",
    ),
  );
  expect(manifest.exports["./components.css"]).toBeUndefined();
  expect(manifest.files).not.toContain("src/components.css");
  expect(manifest.files).not.toContain("src/components/**/*.css");
});

test("registry source files follow generator ordering", () => {
  for (const item of registry.items) {
    const sourcePaths = item.files
      .map((file) => file.path)
      .filter(
        (path) => path !== "LICENSE" && !path.startsWith("registry/styles/"),
      );
    expect(sourcePaths, `stale source ordering in ${item.name}`).toEqual(
      [...sourcePaths].sort(),
    );
  }
});
