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
  /** Opt into a compiled MDX frontmatter export for older module consumers. YAML registry metadata does not require it. */
  frontmatterExport?: boolean;
}

/**
 * Shared MDX compiler conventions, independent of any specific application.
 * Additional remark plugins run after the default Markdown plugins.\n * Compiled frontmatter exports are optional: registry discovery owns YAML metadata.
 * Additional rehype plugins run after TOC and heading slug generation.
 */
export function createMdxOptions(options: MdxToolingOptions = {}) {
  return {
    providerImportSource: "@mdx-js/react",
    remarkPlugins: [
      remarkFrontmatter,
      remarkGfm,
      ...(options.remarkPlugins ?? []),
      ...(options.frontmatterExport ? [[remarkMdxFrontmatter, { name: "frontmatter" }] as const] : []),
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

export * from "./navigation.js";

export * from "./toc.js";

export * from "./headings.js";

export * from "./links.js";

export * from "./check-links.js";
