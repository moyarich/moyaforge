import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeSlug from "rehype-slug";

/**
 * Evaluate a trusted virtual document into a React-compatible MDX module.
 *
 * Supports GitHub Flavored Markdown, recognizes YAML frontmatter without
 * rendering it, and generates prefixed heading IDs.
 *
 * @param source - Complete Markdown or MDX document text.
 * @param filename - Virtual path used in diagnostics; a lowercase .mdx suffix selects MDX, otherwise Markdown is used.
 * @param headingPrefix - String prepended to generated heading IDs to avoid collisions between previews.
 * @returns A promise resolving to the evaluated module, whose default export renders the document.
 * @throws The returned promise rejects if compilation or evaluation fails.
 * @remarks Evaluation executes JavaScript in MDX. Only use trusted document sources.
 * @example
 * ```ts
 * const { default: Content } = await compileVirtualPage(
 *   "# Introduction",
 *   "page.md",
 *   "demo-",
 * );
 * ```
 */
export function compileVirtualPage(
  source: string,
  filename: string,
  headingPrefix: string,
) {
  return evaluate(
    { path: filename, value: source },
    {
      ...runtime,
      development: false,
      format: filename.endsWith(".mdx") ? "mdx" : "md",
      remarkPlugins: [remarkGfm, remarkFrontmatter],
      rehypePlugins: [[rehypeSlug, { prefix: headingPrefix }]],
    },
  );
}
