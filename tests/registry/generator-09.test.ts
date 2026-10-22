import { test, expect } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fixture } from "./fixture.js";
import { buildRegistry } from "../../scripts/build-registry.mjs";

test("locates local CSS imports relative to each stylesheet using real at-rules", async () => {
  const { root, put } = await fixture();
  const folder = "packages/moyaforge-ui/src/components/Nested/NewBadge";
  await put(
    `${folder}/badge.css`,
    `
    /* @import "missing-comment.css"; */
    @import "tokens.css" layer(theme);
    @import url(./nested/layout.css?v=1) screen;
    @import url("./space name.css");
    @import "https://example.com/fonts.css";
    @import url(//example.com/theme.css);
    @import "/host-theme.css";
  `,
  );
  await put(`${folder}/nested/layout.css`, '@import "../tokens.css";');
  await put(`${folder}/space name.css`, ".demo { display: grid; }");
  const { items } = await buildRegistry(root);
  const paths = items
    .find((item) => item.name === "new-badge")
    .files.map((file) => file.path);
  expect(paths).toContain(`${folder}/tokens.css`);
  expect(paths).toContain(`${folder}/nested/layout.css`);
  expect(paths).toContain(`${folder}/space name.css`);
  expect(paths.filter((path) => path.endsWith("tokens.css"))).toHaveLength(1);
  expect(paths.some((path) => path.includes("missing-comment"))).toBe(false);
  await buildRegistry(root, { check: true });
  const previous = await readFile(resolve(root, "registry.json"), "utf8");
  await put(`${folder}/badge.css`, "@import url(missing.css);");
  await expect(buildRegistry(root)).rejects.toThrow(
    "Unresolved registry import",
  );
  expect(await readFile(resolve(root, "registry.json"), "utf8")).toBe(previous);
});
