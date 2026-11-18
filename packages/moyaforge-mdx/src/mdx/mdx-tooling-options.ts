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
} from "../plugins/remark/code-preview/remark-map-file-preview-directives.js";

/** Host-specific remark/rehype plugins are supplied by each consuming app. */
export interface MdxToolingOptions {
  additionalRemarkPlugins?: PluggableList;
  /** Optional mapping from ::: directives to host MDX components. */
  componentMappings?: DirectiveComponentMap;
  /** Transform file-backed ::: preview references into host-resolved PreviewDirective components. */
  filePreviewOptions?: boolean | FilePreviewOptions;
  additionalRehypePlugins?: PluggableList;
  /** Enable raw CSS in code-preview only for reviewed, repository-controlled MDX. Defaults to false. Never enables scripts. */
  allowInlinePreviewStyles?: boolean;
  /** Opt into a compiled MDX frontmatter export for older module consumers. YAML registry metadata does not require it. */
  exportFrontmatter?: boolean;
  /** Optional build-time Shiki rehype plugin, supplied by the host for static code blocks. */
  highlightingPlugin?: PluggableList[number];
}

/**
 * Shared MDX compiler conventions, independent of any specific application.
 * Additional remark plugins run after the default Markdown plugins.
 * Compiled frontmatter exports are optional: registry discovery owns YAML metadata.
 * Optional Shiki highlighting runs after slug/TOC extraction and before host rehype plugins.
 * Only supply Shiki for static prose code blocks; exclude Monaco/runnable components.
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
    [remarkNormalizeDirectiveHeaders, directiveHeaderRules, { allowInlinePreviewStyles }],
    [remarkFlexibleContainers, customBlockOptions],
    remarkNormalizeDirectiveNodes,
  ];
  if (filePreviewOptions) {
    remarkPlugins.push([
      remarkMapFilePreviewDirectives,
      filePreviewOptions === true ? {} : filePreviewOptions,
    ]);
  }
  if (componentMappings) {
    remarkPlugins.push([remarkMapDirectivesToComponents, componentMappings]);
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

  return {
    providerImportSource: "@mdx-js/react",
    remarkPlugins,
    rehypePlugins,
  };
}
