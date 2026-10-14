import type { PluggableList } from "unified";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExportToc from "@stefanprobst/rehype-extract-toc/mdx";

/** Host-specific remark/rehype plugins are supplied by each consuming app. */
export interface MdxToolingOptions {
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
}

/**
 * Shared MDX compiler conventions, independent of any specific application.
 * Additional remark plugins run before the frontmatter export transformer.
 * Additional rehype plugins run after TOC and heading slug generation.
 */
export function createMdxOptions(options: MdxToolingOptions = {}) {
  return {
    providerImportSource: "@mdx-js/react",
    remarkPlugins: [
      remarkFrontmatter,
      remarkGfm,
      ...(options.remarkPlugins ?? []),
      [remarkMdxFrontmatter, { name: "frontmatter" }] as const,
    ] as PluggableList,
    rehypePlugins: [
      rehypeSlug,
      rehypeExtractToc,
      rehypeExportToc,
      ...(options.rehypePlugins ?? []),
    ] as PluggableList,
  };
}

export * from "./registry.js";

export * from "./content.js";
