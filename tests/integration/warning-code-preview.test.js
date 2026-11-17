import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const directory = resolve(
  import.meta.dirname,
  "../../packages/moyaforge-ui/docs/01-components/01-custom-block/01-warning",
);
const page = resolve(directory, "page.mdx");

test("the file-backed component renders the Markdown source and matches the CSS casing", async () => {
  const wrapper = await readFile(resolve(directory, "Example.tsx"), "utf8");
  const example = await readFile(resolve(directory, "Example.mdx"), "utf8");
  const styles = await readFile(resolve(directory, "example.css"), "utf8");

  expect(wrapper).toContain('import Example from "./Example.mdx";');
  expect(example).toContain('import "./example.css";');
  expect(example).toContain("::: warning Before you continue");
  expect(styles).toContain(".warning-example .custom-block.warning");
});
