import { parseDocument } from "yaml";
import {
  buildPageRegistry,
  type PageInput,
  type TocSetting,
} from "../../../packages/moyaforge-mdx/src/registry/index.js";
import { validatePageFrontmatter } from "../../../packages/moyaforge-mdx/src/registry/validate-page-frontmatter.js";

/** Source keys mapped to source-relative Markdown or MDX documents. */
export type VirtualSources = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

/** Build an isolated page registry without files, discovery, or application routes. */
export function createVirtualRegistry(
  sources: VirtualSources,
  options: { toc?: TocSetting } = {},
) {
  const inputs: Record<string, PageInput[]> = {};
  const files: Record<string, string> = {};
  for (const [source, documents] of Object.entries(sources)) {
    inputs[source] = Object.entries(documents).map(([file, content]) => {
      const path = `${source}/${file}`;
      files[path] = content;
      const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
      let frontmatter: unknown = {};
      if (normalized.startsWith("---\n")) {
        const block = /^---\n([\s\S]*?)\n(?:---|\.\.\.)(?:\n|$)/.exec(
          normalized,
        );
        if (!block) throw new Error(`${path}: unterminated frontmatter`);
        const document = parseDocument(block[1]);
        if (document.errors.length)
          throw new Error(`${path}: ${document.errors[0].message}`);
        frontmatter = document.toJS() ?? {};
      }
      validatePageFrontmatter(frontmatter, path);
      return { file, frontmatter };
    });
  }
  return { files, registry: buildPageRegistry(inputs, options) };
}
