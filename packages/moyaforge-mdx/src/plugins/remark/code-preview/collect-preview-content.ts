import { importInlineReactExample } from "./inline-react-module.js";
import { namedCodeBlock } from "../code-block/named-code-block.js";
import type { VFile } from "vfile";
import {
  directiveType,
  type DirectiveHeader,
  type DirectiveNode as Node,
  type DirectiveAttribute as Attribute,
} from "../remark-directive/directive-node.js";
import {
  readPreviewFile,
  readPreviewSources,
  type PreviewFile,
} from "../code-preview-sources/read-preview-sources.js";

export const RELATIVE_COMPONENT_PATH =
  /^(?:\.\/|(?:\.\.\/)+)(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:tsx|jsx)$/;

const COMPONENT_EXTENSION = /\.(?:tsx|jsx)$/;
const PATH_SEGMENT = /^[\w-]+(?:\.[\w-]+)*$/;

function assertRelativeComponentPath(
  value: string,
): asserts value is `./${string}` | `../${string}` {
  const segments = value.split("/");
  const [first] = segments;
  const start = first === "." ? 1 : segments.findIndex((s) => s !== "..");

  const isValid =
    COMPONENT_EXTENSION.test(value) &&
    (first === "." || first === "..") &&
    segments.slice(start).every((s) => PATH_SEGMENT.test(s));

  if (!isValid) {
    throw new Error(
      `Invalid code-preview component path: ${value}. Use a relative path to a .tsx or .jsx file.`,
    );
  }
}

export interface PreviewComponentOptions {
  sourceProp?: string;
  filesProp?: string;
  localSources?: boolean;
  registerInlineReact?: (source: string, authoredFile: string) => string;
  resolveCodePreviewComponent?: (
    reference: string,
    authoredFile: string,
  ) => string | undefined;
}

function componentAttribute(
  selected: PreviewComponentOptions,
  componentPath: string,
  filePath: string | undefined,
): Attribute {
  assertRelativeComponentPath(componentPath);
  /*
  if (!RELATIVE_COMPONENT_PATH.test(componentPath)) {
    throw new Error(
      `code-preview [Invalid component: "${componentPath}"]. Use a relative path to a .tsx or .jsx file.`,
    );
  }*/

  const component =
    filePath && selected.resolveCodePreviewComponent?.(componentPath, filePath);

  if (!component) {
    throw new Error(`Unregistered preview component: ${componentPath}`);
  }

  return { type: "mdxJsxAttribute", name: "component", value: component };
}

function sourceBody(children: Node[], content: Set<Node>, source: string) {
  const groups: Node[][] = [];
  let group: Node[] = [];

  for (const child of children) {
    if (!content.has(child)) {
      group = [];
      continue;
    }
    if (!group.length) groups.push(group);
    group.push(child);
  }

  return groups
    .map((nodes) => {
      const start = nodes[0]?.position?.start.offset;
      const end = nodes.at(-1)?.position?.end.offset;
      return start === undefined || end === undefined
        ? ""
        : source.slice(start, end);
    })
    .join("\n\n");
}

export function collectPreviewContent(
  selected: PreviewComponentOptions,
  children: Node[],
  header: DirectiveHeader | undefined,
  file: VFile,
  source: string,
  attributes: Attribute[],
  filePath?: string,
): Node[] {
  const inlineReact = header?.flags.includes("react") ?? false;
  if (inlineReact && (header?.component || header?.code)) {
    throw new Error(
      "A {react} preview takes its component and source from the directive body.",
    );
  }

  if (header?.component) {
    attributes.push(componentAttribute(selected, header.component, filePath));
  }

  const files: PreviewFile[] = [];
  if (header?.code) {
    files.push(readPreviewFile(header.code, filePath, header.language));
    attributes.push({
      type: "mdxJsxAttribute",
      name: "sourceOnly",
      value: null,
    });
  }

  let replacements = header?.replacements;
  let hasLocalSources = false;

  const content = children.filter((child) => {
    if (
      selected.localSources &&
      directiveType(child) === "code-preview-sources"
    ) {
      const sources = readPreviewSources(child, file, filePath);
      files.push(...sources.files);
      hasLocalSources = true;
      replacements ??= sources.replacements;
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

  if (replacements) {
    attributes.push({
      type: "mdxJsxAttribute",
      name: "replacementPreset",
      value: replacements,
    });
  }

  if (!selected.sourceProp && !inlineReact) return content;

  const body = sourceBody(children, new Set(content), source);

  if (selected.sourceProp) {
    attributes.push({
      type: "mdxJsxAttribute",
      name: selected.sourceProp,
      value: hasLocalSources && !inlineReact ? "" : body,
    });
  }

  if (!inlineReact) return content;

  if (!filePath || !selected.registerInlineReact) {
    throw new Error("{react} previews require the Vite code preview plugin.");
  }
  if (!body.trim()) {
    throw new Error("A {react} preview requires a JSX body.");
  }

  return [
    importInlineReactExample(
      file,
      selected.registerInlineReact(body, filePath),
    ),
  ];
}
