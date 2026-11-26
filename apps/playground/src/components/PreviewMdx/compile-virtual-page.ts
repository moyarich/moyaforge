import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeSlug from "rehype-slug";

/** Compile virtual Markdown/MDX content without rendering its YAML metadata. */
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
