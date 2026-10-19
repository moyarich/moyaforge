import { expect, test } from "vitest";
import { buildPageRegistry } from "../../dist/index.js";
import { buildDocumentationGroups } from "../../dist/navigation/tree.js";

function groups(frontmatter) {
  const registry = buildPageRegistry({
    ui: [
      {
        file: "page.mdx",
        frontmatter: {
          title: "UI Components",
          label: "Overview",
          ...frontmatter,
        },
      },
      { file: "01-components/01-button/page.mdx" },
    ],
  });
  return buildDocumentationGroups(registry.pages, {
    ui: { navigation: { label: "UI Components" } },
  });
}
test("frontmatter promotes a landing page to a linked, collapsible source heading without a duplicate overview", () => {
  const [group] = groups({
    sidebar: { group: true, collapsible: true, defaultOpen: false },
  });
  expect(group.page.path).toBe("/ui");
  expect(group.label).toBe("UI Components");
  expect(group.collapsible).toBe(true);
  expect(group.defaultOpen).toBe(false);
  expect(group.nodes.map((node) => node.path)).toEqual(["/ui/components"]);
  expect(
    groups({ sidebar: { group: true, label: "Custom heading" } })[0].label,
  ).toBe("Custom heading");
});
test("ordinary and hidden landing pages retain existing navigation behavior", () => {
  expect(groups({})[0].page).toBeUndefined();
  expect(groups({})[0].nodes[0].page.label).toBe("Overview");
  const [hidden] = groups({ navigation: "hidden", sidebar: { group: true } });
  expect(hidden.page).toBeUndefined();
  expect(hidden.nodes[0].path).toBe("/ui/components");
});
test("sidebar frontmatter validates disclosure options", () => {
  for (const sidebar of [
    true,
    { group: "yes" },
    { collapsible: 1 },
    { defaultOpen: "no" },
    { label: false },
  ])
    expect(() => groups({ sidebar })).toThrow(/sidebar/);
});

test("menu icon metadata survives normalization and source landing promotion", () => {
  const [group] = groups({ icon: "folder-open", sidebar: { group: true } });
  expect(group.page.icon).toBe("folder-open");
  const registry = buildPageRegistry({
    docs: [{ file: "guide/page.mdx", frontmatter: { icon: "book-open" } }],
  });
  expect(registry.pages[0].icon).toBe("book-open");
  for (const icon of [42, "", "FolderOpen", "../bad", false])
    expect(() => groups({ icon })).toThrow(/icon/);
});
