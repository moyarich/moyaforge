import { importInlineReactExample } from "./inline-react-module.js";
import type { InlinePreviewAsset } from "./mask-inline-preview-assets.js";
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

export function collectPreviewContent(
  selected: PreviewComponentOptions,
  children: Node[],
  header: DirectiveHeader | undefined,
  file: VFile,
  source: string,
  attributes: Attribute[],
  filePath?: string,
  container?: Node,
) {
  const inlineReact = header?.flags.includes("react");
  if (inlineReact && (header?.component || header?.code))
    throw new Error(
      "A {react} preview takes its component and source from the directive body.",
    );
  if (header?.component) {
    if (!/^(?:\.\/|\.\.\/)+(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:tsx|jsx)(?:#[A-Za-z_$][\w$]*)?$/.test(header.component))
      throw new Error(
        `Invalid code-preview component: ${header.component}. Use a relative .tsx/.jsx file under a registered component root; append #ExportName for a named export.`,
      );
    const component =
      filePath &&
      selected.resolveCodePreviewComponent?.(header.component, filePath);
    if (!component)
      throw new Error(
        `Unregistered preview component: ${header.component}. Register its directory in createCodePreview({ componentRoots: [...] }), or use a sibling .tsx/.jsx example. Check the path and casing.`,
      );
    attributes.push({
      type: "mdxJsxAttribute",
      name: "component",
      value: component,
    });
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
  if (replacements)
    attributes.push({
      type: "mdxJsxAttribute",
      name: "replacementPreset",
      value: replacements,
    });
  if (selected.sourceProp || inlineReact) {
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
    // Capture the complete authored source, including raw <style>/<script>
    // content that the MDX parser masks or omits from child positions.
    // File-backed source directives and named source fences continue to
    // use the filtered child ranges, so extra source tabs stay separate.
    const fromContainer =
      !inlineReact && content.length === children.length
        ? sourceFromPreviewContainer(source, container)
        : undefined;
    const body =
      fromContainer ??
      groups
        .map((nodes) => {
          const start = nodes[0]?.position?.start.offset;
          const end = nodes.at(-1)?.position?.end.offset;
          return start === undefined || end === undefined
            ? ""
            : source.slice(start, end);
        })
        .join("\n\n");
    if (selected.sourceProp)
      attributes.push({
        type: "mdxJsxAttribute",
        name: selected.sourceProp,
        value: hasLocalSources && !inlineReact ? "" : body,
      });
    if (inlineReact) {
      if (!filePath || !selected.registerInlineReact)
        throw new Error(
          "{react} previews require the Vite code preview plugin.",
        );
      if (!body.trim())
        throw new Error("A {react} preview requires a JSX body.");
      return [
        importInlineReactExample(
          file,
          selected.registerInlineReact(body, filePath),
        ),
      ];
    }
  }
  const assets = file.data.inlinePreviewAssets ?? [];
  return content.flatMap((child): Node[] => {
    // The parser restores positions to offsets in the unmodified MDX source.
    const asset = assets.find(
      (entry) =>
        child.type === "mdxJsxFlowElement" &&
        child.name === entry.tag &&
        child.position?.start.offset === entry.offset,
    );
    if (!asset) return [child];
    // The raw code stays in the source tab, but cannot run in the preview.
    if (!asset.render) return [];
    if (!filePath || !selected.registerInlineReact)
      throw new Error(
        "Inline <" + asset.tag + "> in code-preview requires the Vite code-preview plugin (registerInlineReact).",
      );
    return [importInlineReactExample(
      file,
      selected.registerInlineReact(inlineAssetModule(asset), filePath),
    )];
  });
}

/** Compile reviewed CSS as text; never emit executable raw script modules. */
function inlineAssetModule(asset: InlinePreviewAsset): string {
  // Reviewed CSS is compiled as text, never as executable JavaScript.
  return "<style>{" + JSON.stringify(asset.code) + "}</style>";
}

/**
 * Slice the Markdown directive body from the original authored text.
 *
 * Its child AST positions can omit masked raw CSS/JS or be absent after
 * directive normalization, but the outer container retains the full range.
 * The opening and closing :::/:::: fences are not part of the source tab.
 */
function sourceFromPreviewContainer(
  source: string,
  container?: Node,
): string | undefined {
  const start = container?.position?.start.offset;
  const end = container?.position?.end.offset;
  if (start === undefined || end === undefined || end <= start)
    return undefined;

  const openerEnd = source.indexOf("\n", start);
  if (openerEnd < 0 || openerEnd >= end) return undefined;

  const closerStart = source.lastIndexOf("\n", end - 1) + 1;
  if (closerStart <= openerEnd || !/^:{3,}\s*$/.test(source.slice(closerStart, end)))
    return undefined;

  return source
    .slice(openerEnd + 1, closerStart)
    .replace(/^(?:[ \t]*\r?\n)+/, "")
    .replace(/(?:\r?\n[ \t]*)+$/, "");
}
