import type { CompileOptions } from "@mdx-js/mdx";
import type { PreviewFile } from "../preview-code-sources/read-preview-sources.js";

export interface InlinePreviewOptions {
  format?: "mdx" | "jsx" | "tsx" | "js" | "ts" | "json" | "css";
  filename?: string;
  /** Isolated React body: a TSX module or a snippet ending in JSX. */
  reactBody?: boolean;
  files?: PreviewFile[];
  mdxOptions?: CompileOptions;
}
