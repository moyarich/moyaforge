import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import type { VFile } from "vfile";
import {
  directiveHeader,
  type DirectiveNode,
} from "../remark-directive/directive-node.js";

export interface PreviewFile {
  label: string;
  code: string;
  language?: string;
}

export function readPreviewSources(
  child: DirectiveNode,
  file: VFile,
  filePath?: string,
) {
  const refs =
    child.directiveHeader ?? directiveHeader(child.children?.[0], file);
  if (!refs?.sources || !filePath)
    throw new Error(
      "code-preview-sources requires local files and an MDX filename.",
    );
  const directory = realpathSync(dirname(filePath));
  const files: PreviewFile[] = [];
  for (const reference of refs.sources
    .split(",")
    .map((value) => value.trim())) {
    if (
      !/^\.\/[\w-]+(?:\.[\w-]+)*\.(?:mdx?|tsx|jsx|ts|js|css|json)$/.test(
        reference,
      )
    )
      throw new Error(`Invalid preview source: ${reference}`);
    const path = realpathSync(join(directory, reference));
    if (dirname(path) !== directory)
      throw new Error(`Preview source escapes its directory: ${reference}`);
    files.push({
      label: reference.slice(2),
      code: readFileSync(path, "utf8"),
    });
  }
  return { files, replacements: refs.replacements };
}
