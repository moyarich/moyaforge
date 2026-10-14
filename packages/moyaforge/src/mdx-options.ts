import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExportToc from "@stefanprobst/rehype-extract-toc/mdx";

/**
 * Shared compiler configuration for page.mdx documentation.
 * Pass the result to @mdx-js/rollup or @mdx-js/mdx, with
 * providerImportSource set to @mdx-js/react.
 *
 * A consuming app can extend the remark and rehype arrays (e.g. search indexing)
 * without changing the default frontmatter, GFM, slug, or TOC conventions.
 */
export function createMoyaForgeMdxOptions() {
  return {
    providerImportSource: "@mdx-js/react",
    remarkPlugins: [
      remarkFrontmatter,
      remarkGfm,
      [remarkMdxFrontmatter, { name: "frontmatter" }],
    ],
    rehypePlugins: [rehypeSlug, rehypeExtractToc, rehypeExportToc],
  };
}
