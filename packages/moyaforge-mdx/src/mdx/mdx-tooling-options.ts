import { unified } from "unified";
import remarkParse from "remark-parse";
import type { DirectiveNode } from "../plugins/remark/remark-directive/directive-node.js";
import { directiveHeaderRules } from "../plugins/remark/directive-header-rules.js";
import remarkDirective from "remark-directive";
import { remarkNormalizeDirectiveNodes } from "../plugins/remark/custom-block/remark-normalize-directive-nodes.js";
import { remarkNormalizeDirectiveHeaders } from "../plugins/remark/remark-directive/remark-normalize-directive-headers.js";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";

import remarkFlexibleContainers from "remark-flexible-containers";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExportToc from "@stefanprobst/rehype-extract-toc/mdx";
import type { PluggableList } from "unified";

import { rehypeAnnotateCodeBlocks } from "../plugins/rehype/rehype-annotate-code-blocks.js";
import { customBlockOptions } from "../plugins/remark/custom-block/custom-blocks.js";
import {
  type DirectiveComponentMap,
  remarkMapDirectivesToComponents,
} from "./remark-map-directives-to-components.js";
import {
  type FilePreviewOptions,
  remarkMapFilePreviewDirectives,
} from "../plugins/remark/preview-code/remark-map-file-preview-directives.js";

/** Host options for the shared MDX pipeline; plugin ordering preserves authored source before directive mapping and extracts headings before highlighting. */
export interface MdxToolingOptions {
  additionalRemarkPlugins?: PluggableList;
  /** Optional mapping from ::: directives to host MDX components. */
  componentMappings?: DirectiveComponentMap;
  /** Transform file-backed ::: preview references into host-resolved PreviewDirective components. */
  filePreviewOptions?: boolean | FilePreviewOptions;
  additionalRehypePlugins?: PluggableList;
  /** Enable raw CSS in preview-code only for reviewed, repository-controlled MDX. Defaults to false. Never enables scripts. */
  allowInlinePreviewStyles?: boolean;
  /** Opt into a compiled MDX frontmatter export for older module consumers. YAML registry metadata does not require it. */
  exportFrontmatter?: boolean;
  /** Optional build-time Shiki rehype plugin, supplied by the host for static code blocks. */
  highlightingPlugin?: PluggableList[number];
}

/**
 * Create shared MDX compiler options independent of any application.
 * Includes directive parsing, frontmatter, GFM, heading slugs and TOC exports. Optional highlighting runs after heading extraction; additional host plugins run after the corresponding default pipeline.
 * @param options - Host directive mappings, preview settings and additional compiler plugins.
 * @returns MDX provider import source and ordered remark/rehype plugin lists.
 * @remarks Only enable inline preview styles for trusted, reviewed content. Use highlighting for static prose rather than runnable Monaco examples.
 * @example const mdxOptions = createMdxOptions({ exportFrontmatter: true });
 */
export function createMdxOptions({
  additionalRemarkPlugins = [],
  additionalRehypePlugins = [],
  componentMappings,
  filePreviewOptions,
  allowInlinePreviewStyles = false,
  exportFrontmatter,
  highlightingPlugin,
}: MdxToolingOptions = {}) {
  const remarkPlugins: PluggableList = [
    remarkFrontmatter,
    remarkGfm,
    remarkDirective,
    [
      remarkNormalizeDirectiveHeaders,
      directiveHeaderRules,
      { allowInlinePreviewStyles },
    ],
    [remarkFlexibleContainers, customBlockOptions],
    remarkNormalizeDirectiveNodes,
  ];
  if (filePreviewOptions) {
    remarkPlugins.push([
      remarkMapFilePreviewDirectives,
      filePreviewOptions === true ? {} : filePreviewOptions,
    ]);
  }
  const previewMappings =
    componentMappings &&
    Object.fromEntries(
      Object.entries(componentMappings).map(([name, mapping]) => [
        name,
        {
          ...mapping,
          renderPreviewMarkdown(source: string, authoredFile?: string) {
            const processor = unified().use(remarkParse).use(remarkPlugins);
            const file = { value: source, path: authoredFile };
            return (
              processor.runSync(processor.parse(file), file) as unknown as {
                children: DirectiveNode[];
              }
            ).children;
          },
          previewMdxOptions: {
            providerImportSource: "@mdx-js/react",
            remarkPlugins,
          } as import("@mdx-js/mdx").CompileOptions,
        },
      ]),
    );
  if (previewMappings) {
    remarkPlugins.push([remarkMapDirectivesToComponents, previewMappings]);
  }
  remarkPlugins.push(...additionalRemarkPlugins);
  if (exportFrontmatter) {
    remarkPlugins.push([remarkMdxFrontmatter, { name: "frontmatter" }]);
  }

  const rehypePlugins: PluggableList = [
    rehypeSlug,
    rehypeAnnotateCodeBlocks,
    rehypeExtractToc,
    rehypeExportToc,
  ];
  if (highlightingPlugin) rehypePlugins.push(highlightingPlugin);
  rehypePlugins.push(...additionalRehypePlugins);

  for (const mapping of Object.values(previewMappings ?? {})) {
    mapping.previewMdxOptions.rehypePlugins = rehypePlugins;
  }

  return {
    providerImportSource: "@mdx-js/react",
    remarkPlugins,
    rehypePlugins,
  };
}
