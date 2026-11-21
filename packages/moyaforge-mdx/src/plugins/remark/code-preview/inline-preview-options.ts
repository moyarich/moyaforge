import type { CompileOptions } from "@mdx-js/mdx";
import type { PreviewFile } from "../code-preview-sources/read-preview-sources.js";

export interface InlinePreviewOptions {
  format?: "mdx" | "jsx" | "tsx" | "js" | "ts" | "json" | "css";
  filename?: string;
  files?: PreviewFile[];
  mdxOptions?: CompileOptions;
}
