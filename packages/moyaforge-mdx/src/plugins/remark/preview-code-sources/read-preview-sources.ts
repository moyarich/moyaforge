import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import type { VFile } from "vfile";
import {
  directiveHeader,
  previewHeader,
  type DirectiveNode,
} from "../remark-directive/directive-node.js";

export interface PreviewFile {
  label: string;
  code: string;
  language?: string;
}

const previewFilePattern =
  /^\.\/[\w-]+(?:\.[\w-]+)*\.(?:mdx?|tsx|jsx|ts|js|css|json)$/;

export function readPreviewFile(
  reference: string,
  filePath: string | undefined,
  language?: string,
): PreviewFile {
  if (!filePath)
    throw new Error("A preview-code source requires an MDX filename.");
  if (!previewFilePattern.test(reference))
    throw new Error(`Invalid preview source: ${reference}`);

  const directory = realpathSync(dirname(filePath));
  const path = realpathSync(join(directory, reference));
  if (dirname(path) !== directory)
    throw new Error(`Preview source escapes its directory: ${reference}`);

  return {
    label: reference.slice(2),
    code: readFileSync(path, "utf8"),
    ...(language ? { language } : {}),
  };
}

export function readPreviewSources(
  child: DirectiveNode,
  file: VFile,
  filePath?: string,
) {
  const refs =
    previewHeader(child.directiveHeader ?? directiveHeader(child.children?.[0], file));
  if (!refs?.sources || !filePath)
    throw new Error(
      "preview-code-sources requires local files and an MDX filename.",
    );

  const files = refs.sources
    .split(",")
    .map((value) => value.trim())
    .map((reference) => readPreviewFile(reference, filePath));

  return { files, replacements: refs.replacements };
}
