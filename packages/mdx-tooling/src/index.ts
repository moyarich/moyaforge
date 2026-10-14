import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExportToc from "@stefanprobst/rehype-extract-toc/mdx";

/** Shared MDX compiler conventions. Does not depend on Console or MoyaForge. */
export function createMdxOptions() {
  return {
    providerImportSource: "@mdx-js/react",
    remarkPlugins: [
      remarkFrontmatter,
      remarkGfm,
      [remarkMdxFrontmatter, { name: "frontmatter" }] as const,
    ],
    rehypePlugins: [rehypeSlug, rehypeExtractToc, rehypeExportToc],
  };
}
