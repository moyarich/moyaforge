import { expect, test } from "vitest";
import { buildPageRegistry, createPageId } from "../../dist/index.js";

test("titles generate normalized URL-safe IDs", () => {
  expect(createPageId("  Crème brûlée & React / MDX!  ")).toBe(
    "creme-brulee-react-mdx",
  );
  expect(createPageId("中文 指南")).toBe("中文-指南");
  expect(() => createPageId("!!!")).toThrow(/letter or number/);
});
test("titles determine page and ancestor route segments independently of folder names", () => {
  const registry = buildPageRegistry({
    docs: [
      { file: "page.mdx", frontmatter: { title: "Welcome" } },
      {
        file: "01-old-folder/page.mdx",
        frontmatter: { title: "Getting started" },
      },
      {
        file: "01-old-folder/02-old-file.md",
        frontmatter: { title: "Choose a plan" },
      },
    ],
  });
  expect(registry.pages.find((page) => page.file === "page.mdx")).toMatchObject(
    { id: "welcome", path: "/docs" },
  );
  expect(
    registry.byPath.get("/docs/getting-started/choose-a-plan"),
  ).toMatchObject({
    id: "choose-a-plan",
    title: "Choose a plan",
      parentPath: "/docs/getting-started",
  });
});
test("duplicate sibling titles fail instead of silently creating unstable URLs", () => {
  expect(() =>
    buildPageRegistry({
      docs: [
        { file: "01-first/page.md", frontmatter: { title: "Getting started" } },
        {
          file: "02-second/page.md",
          frontmatter: { title: "Getting started!" },
        },
      ],
    }),
  ).toThrow(/Duplicate route \/docs\/getting-started/);
});
test("page labels are rejected in favor of a single title", () => {
  expect(() =>
    buildPageRegistry({
      docs: [
        { file: "page.md", frontmatter: { title: "Docs", label: "Other" } },
      ],
    }),
  ).toThrow(/use title instead of label/);
  expect(() =>
    buildPageRegistry({
      docs: [{ file: "page.md", frontmatter: { title: " " } }],
    }),
  ).toThrow(/title must not be empty/);
});

test("registry pages expose a title without a duplicate label", () => {
  const page = buildPageRegistry({ docs: [{ file: "page.md", frontmatter: { title: "Docs" } }] }).pages[0];
  expect(page.title).toBe("Docs");
  expect(page).not.toHaveProperty("label");
});
