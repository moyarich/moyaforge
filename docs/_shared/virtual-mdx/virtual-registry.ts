import { parseDocument } from "yaml";
import {
  buildPageRegistry,
  type PageInput,
  type TocSetting,
} from "../../../packages/moyaforge-mdx/src/registry/index.js";
import { validatePageFrontmatter } from "../../../packages/moyaforge-mdx/src/registry/validate-page-frontmatter.js";

/**
 * In-memory documents grouped by registry source key.
 *
 * Each source maps relative document filenames to their complete Markdown or
 * MDX text, including optional YAML frontmatter.
 *
 * @example
 * ```ts
 * const sources: VirtualSources = {
 *   guide: { "intro/page.md": "---\ntitle: Introduction\n---\n# Introduction" },
 * };
 * ```
 */
export type VirtualSources = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

/**
 * Build an isolated page registry from in-memory documentation sources.
 *
 * Parses and validates each document's leading YAML frontmatter before passing
 * page inputs to the normal registry builder. No filesystem discovery or
 * application route registration is performed.
 *
 * @param sources - Documents grouped by source key and relative filename.
 * @param options - Registry options; toc supplies the registry-level table-of-contents setting.
 * @returns The original document text keyed by source/filename, together with the built registry.
 * @throws If frontmatter is unterminated, contains invalid YAML, or fails page metadata validation.
 * @example
 * ```ts
 * const { files, registry } = createVirtualRegistry({
 *   guide: { "intro/page.md": "# Introduction" },
 * });
 * const source = files["guide/intro/page.md"];
 * ```
 */
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
