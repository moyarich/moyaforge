import remarkFlexibleContainers from "remark-flexible-containers";
import { customBlockOptions } from "./custom-blocks.js";
import { remarkDirectiveComponents, type DirectiveComponentMap } from "./directive-components.js";
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
  /** Optional mapping from ::: directives to host MDX components. */
  directiveComponents?: DirectiveComponentMap;
  rehypePlugins?: PluggableList;
  /** Opt into a compiled MDX frontmatter export for older module consumers. YAML registry metadata does not require it. */
  frontmatterExport?: boolean;
  /** Optional build-time Shiki rehype plugin, supplied by the host for static code blocks. */
  shiki?: PluggableList[number];
}

/**
 * Shared MDX compiler conventions, independent of any specific application.
 * Additional remark plugins run after the default Markdown plugins.\n * Compiled frontmatter exports are optional: registry discovery owns YAML metadata.
 * Optional Shiki highlighting runs after slug/TOC extraction and before host rehype plugins.\n * Only supply Shiki for static prose code blocks; exclude Monaco/runnable components.
 */
export function createMdxOptions(options: MdxToolingOptions = {}) {
  return {
    providerImportSource: "@mdx-js/react",
    remarkPlugins: [
      remarkFrontmatter,
      remarkGfm,
      [remarkFlexibleContainers, customBlockOptions],
      ...(options.directiveComponents ? [[remarkDirectiveComponents, options.directiveComponents] as const] : []),
      ...(options.remarkPlugins ?? []),
      ...(options.frontmatterExport
        ? [[remarkMdxFrontmatter, { name: "frontmatter" }] as const]
        : []),
    ] as PluggableList,
    rehypePlugins: [
      rehypeSlug,
      rehypeExtractToc,
      rehypeExportToc,
      ...(options.shiki ? [options.shiki] : []),
      ...(options.rehypePlugins ?? []),
    ] as PluggableList,
  };
}

export * from "./directive-components.js";

export * from "./registry.js";

export * from "./content.js";

export * from "./navigation.js";

export * from "./toc.js";

export * from "./headings.js";

export * from "./links.js";

export * from "./check-links.js";
