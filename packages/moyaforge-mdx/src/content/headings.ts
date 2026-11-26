import { directiveHeaderRules } from "../plugins/remark/directive-header-rules.js";
import remarkDirective from "remark-directive";
import { remarkNormalizeDirectiveHeaders } from "../plugins/remark/remark-directive/remark-normalize-directive-headers.js";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import { VFile } from "vfile";
import type { TocHeading } from "../navigation/toc/index.js";

/**
 * Extract headings using the same rehype-slug + rehype-extract-toc combination
 * used by the MDX compiler, without evaluating the page component.
 */
export async function extractPageHeadings(
  markdownSource: string,
  filename = "page.md",
): Promise<TocHeading[]> {
  const headingProcessor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkMdx)
    .use(remarkDirective)
    .use(remarkNormalizeDirectiveHeaders, directiveHeaderRules, {
      allowInlinePreviewStyles: true,
    })
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeExtractToc);
  const markdownFile = new VFile({ value: markdownSource, path: filename });
  const markdownTree = headingProcessor.parse(markdownFile);
  await headingProcessor.run(markdownTree, markdownFile);

  type ExtractedHeading = {
    id?: string;
    value: string;
    depth: number;
    children?: ExtractedHeading[];
  };

  const normalizeHeadings = (
    headings: readonly ExtractedHeading[],
  ): TocHeading[] =>
    headings.flatMap((heading) => {
      const childHeadings = normalizeHeadings(heading.children ?? []);
      if (!heading.id) return childHeadings;
      return [
        {
          id: heading.id,
          value: heading.value,
          depth: heading.depth,
          ...(childHeadings.length ? { children: childHeadings } : {}),
        },
      ];
    });

  return normalizeHeadings((markdownFile.data.toc ?? []) as ExtractedHeading[]);
}
