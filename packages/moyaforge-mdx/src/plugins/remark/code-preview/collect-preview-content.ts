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
    const body = groups
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
  return content.map((child) => {
    // The parser restores positions to offsets in the unmodified MDX source.
    const asset = assets.find(
      (entry) =>
        child.type === "mdxJsxFlowElement" &&
        child.name === entry.tag &&
        child.position?.start.offset === entry.offset,
    );
    if (!asset) return child;
    if (!filePath || !selected.registerInlineReact)
      throw new Error(
        "Inline <" + asset.tag + "> in code-preview requires the Vite code-preview plugin (registerInlineReact).",
      );
    return importInlineReactExample(
      file,
      selected.registerInlineReact(inlineAssetModule(asset), filePath),
    );
  });
}

/** Build-time-compiled, preview-local effects (never runtime eval). */
function inlineAssetModule(asset: InlinePreviewAsset): string {
  if (asset.tag === "style") {
    return "<style>{" + JSON.stringify(asset.code) + "}</style>";
  }
  // root is the stage enclosing this preview, not document/global selectors.
  // Cleanup returned by the authored script is invoked on unmount.
  return [
    'import { useEffect, useRef } from "react";',
    "export function PreviewInlineScript() {",
    "  const anchor = useRef(null);",
    "  useEffect(() => {",
    '    const root = anchor.current?.closest(".mf-preview-stage");',
    "    if (!root) return;",
    "    const setup = (root) => {",
    asset.code,
    "    };",
    "    return setup(root);",
    "  }, []);",
    '  return <span ref={anchor} hidden aria-hidden="true" />;',
    "}",
    "", // MDX needs a blank line between module exports and Markdown JSX.
    "<PreviewInlineScript />",
  ].join("\n");
}
