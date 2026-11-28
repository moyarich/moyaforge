import { createDiagnostic, MdxDiagnosticError } from "../diagnostics/index.js";
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
 * Extract compiler-compatible nested headings without evaluating MDX.
 * Uses rehype-slug and rehype-extract-toc to preserve the rendered anchor IDs.
 * @param markdownSource - Complete Markdown or MDX source.
 * @param filename - Source path used in diagnostics. Defaults to page.md.
 * @returns A promise resolving to the nested heading tree.
 * @throws MdxDiagnosticError when parsing or transformation fails.
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
  try {
    const markdownTree = headingProcessor.parse(markdownFile);
    await headingProcessor.run(markdownTree, markdownFile);
  } catch (error) {
    throw new MdxDiagnosticError(createDiagnostic(error, {
      code: "MDX_HEADING_PARSE_FAILED",
      phase: "discovery",
      location: { file: filename },
      source: markdownSource,
    }), error);
  }

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
