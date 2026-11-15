import { namedCodeBlock } from "../code-block/named-code-block.js";
import type { VFile } from "vfile";
import {
  directiveType,
  type DirectiveHeader,
  type DirectiveNode as Node,
  type DirectiveAttribute as Attribute,
} from "../remark-directive/directive-node.js";
import {
  readPreviewSources,
  type PreviewFile,
} from "../code-preview-sources/read-preview-sources.js";

export interface PreviewComponentOptions {
  sourceProp?: string;
  filesProp?: string;
  localSources?: boolean;
  resolveCodePreviewExample?: (
    reference: string,
    authoredFile: string,
  ) => string | undefined;
}

export function collectPreviewContent(
  selected: PreviewComponentOptions,
  children: Node[],
  header: DirectiveHeader | undefined,
  file: VFile,
  source: string,
  attributes: Attribute[],
  filePath?: string,
) {
  if (header?.example) {
    const example =
      filePath &&
      selected.resolveCodePreviewExample?.(header.example, filePath);
    if (!example)
      throw new Error(`Unregistered preview example: ${header.example}`);
    attributes.push({
      type: "mdxJsxAttribute",
      name: "example",
      value: example,
    });
  }
  const files: PreviewFile[] = [];
  let replacements: string | undefined;
  let hasLocalSources = false;
  const content = children.filter((child) => {
    if (
      selected.localSources &&
      directiveType(child) === "code-preview-sources"
    ) {
      const sources = readPreviewSources(child, file, filePath);
      files.push(...sources.files);
      hasLocalSources = true;
      replacements = sources.replacements;
      return false;
    }
    const block = selected.filesProp && namedCodeBlock(child);
    if (!block) return true;
    files.push(block);
    return false;
  });
  if (selected.filesProp && files.length) {
    attributes.push({
      type: "mdxJsxAttribute",
      name: selected.filesProp,
      value: JSON.stringify(files),
    });
  }
  if (replacements)
    attributes.push({
      type: "mdxJsxAttribute",
      name: "replacementPreset",
      value: replacements,
    });
  if (selected.sourceProp) {
    const groups: Node[][] = [];
    let group: Node[] = [];
    for (const child of children) {
      if (content.includes(child)) {
        if (!group.length) groups.push(group);
        group.push(child);
      } else {
        group = [];
      }
    }
    attributes.push({
      type: "mdxJsxAttribute",
      name: selected.sourceProp,
      value: hasLocalSources
        ? ""
        : groups
            .map((nodes) => {
              const start = nodes[0]?.position?.start.offset;
              const end = nodes.at(-1)?.position?.end.offset;
              return start === undefined || end === undefined
                ? ""
                : source.slice(start, end);
            })
            .join("\n\n"),
    });
  }
  return content;
}
