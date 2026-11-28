import { directiveDiagnostic } from "../../../diagnostics/directive-diagnostic.js";
import { resolve, dirname } from "node:path";
import { directivePropAttribute } from "../remark-directive/directive-attributes.js";
import type { InlinePreviewOptions } from "./inline-preview-options.js";
import { renderPreviewStyles } from "./render-preview-styles.js";
import { renderMarkdownFence } from "./render-markdown-fence.js";
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
} from "../preview-code-sources/read-preview-sources.js";

export interface PreviewComponentOptions {
  /** Emit the public PreviewCode contract (typed files, children and replacements). */
  directPreviewCode?: boolean;
  sourceProp?: string;
  filesProp?: string;
  localSources?: boolean;
  registerInlineReact?: (
    source: string,
    authoredFile: string,
    options?: InlinePreviewOptions,
  ) => string;
  /** Parse selected Markdown through the host's configured remark plugins. */
  renderPreviewMarkdown?: (source: string, authoredFile?: string) => Node[];
  /** Compiler configuration for isolated MDX fences. */
  previewMdxOptions?: InlinePreviewOptions["mdxOptions"];
  resolvePreviewCodeComponent?: (
    reference: string,
    authoredFile: string,
  ) => string | undefined;
}

/**
 * Collect source tabs and renderable nodes independently for one preview directive.
 * Capture original authored ranges (including masked raw styles and scripts),
 * while keeping named fences and local sources in separate tabs. Raw scripts
 * remain source-only; reviewed raw CSS requires the host module registrar.
 * @param selected - Host mapping and optional compiler/module resolution hooks.
 * @param children - Parsed directive body nodes.
 * @param header - Authored preview options.
 * @param file - Compiler file carrying captured assets and generated imports.
 * @param source - Original, unmodified authored document.
 * @param attributes - Component attributes to populate with source metadata.
 * @param filePath - Authored filename used for local references and diagnostics.
 * @param container - Outer directive node used for full source-range recovery.
 * @returns Nodes permitted to render in the live preview.
 */
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
  const direct = selected.directPreviewCode === true;

  if (header?.preview && (header.component || header.code))
    throw new Error(
      "preview-code preview cannot be combined with component or code.",
    );
  let example: Node | undefined;
  if (header?.component) {
    if (
      !/^(?:\.\/|\.\.\/)+(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:tsx|jsx)(?:#[A-Za-z_$][\w$]*)?$/.test(
        header.component,
      )
    )
      throw directiveDiagnostic(new Error(`Invalid preview-code component: ${header.component}`), source, filePath ?? "<input>", header.offset ?? container?.position?.start.offset, "preview-code", {
        code: "MDX_INVALID_COMPONENT_REFERENCE", phase: "resolve", attribute: "component",
        expected: "Relative .tsx or .jsx path, optionally followed by #ExportName",
        suggestion: 'Use component="./Example.tsx" or component="./Example.tsx#Example".',
      });
    const component =
      filePath &&
      selected.resolvePreviewCodeComponent?.(header.component, filePath);
    if (!component)
      throw directiveDiagnostic(new Error(`Unregistered preview component: ${header.component}`), source, filePath ?? "<input>", header.offset ?? container?.position?.start.offset, "preview-code", {
        code: "MDX_COMPONENT_NOT_REGISTERED", phase: "resolve", attribute: "component",
        related: filePath ? [{ file: resolve(dirname(filePath), header.component.split("#")[0]) }] : undefined,
        suggestion: "Check the path and casing, or register the containing directory in createPreviewCodePlugin({ componentRoots: [...] }).",
      });
    if (direct) {
      example = importInlineReactExample(file, "virtual:moyaforge-mdx/preview-example/" + encodeURIComponent(component));
    } else {
      attributes.push({
        type: "mdxJsxAttribute",
        name: "component",
        value: component,
      });
    }
  }

  const files: PreviewFile[] = [];
  const fences: PreviewFile[] = [];
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
      directiveType(child) === "preview-code-sources"
    ) {
      const sources = readPreviewSources(child, file, filePath);
      files.push(...sources.files);
      hasLocalSources = true;
      replacements ??= sources.replacements;
      return false;
    }
    const block = (direct || selected.filesProp) && namedCodeBlock(child);
    if (!block) return true;
    files.push(block);
    fences.push(block);
    return false;
  });
  if (header?.preview) {
    const names = header.preview.split(",").map((name) => name.trim());
    if (names.some((name) => !name) || new Set(names).size !== names.length)
      throw new Error(
        "preview-code preview requires distinct, nonempty fence filenames.",
      );
    const selectedFences = names.map((name) => {
      const matches = fences.filter((fence) => fence.label === name);
      if (matches.length !== 1)
        throw new Error(
          `preview-code preview="${name}" must match exactly one named code fence.`,
        );
      return matches[0];
    });
    const styles = selectedFences.filter(
      (fence) => previewLanguage(fence) === "css",
    );
    const entries = selectedFences.filter(
      (fence) => previewLanguage(fence) !== "css",
    );
    const rendered = entries.flatMap((fence) => {
      const language = previewLanguage(fence);
      if (language === "md" || language === "markdown")
        return (selected.renderPreviewMarkdown ?? renderMarkdownFence)(
          fence.code,
          filePath,
        );
      if (language === "html") {
        const value = JSON.stringify(fence.code);
        return [
          {
            type: "mdxJsxFlowElement",
            name: "div",
            attributes: [
              {
                type: "mdxJsxAttribute",
                name: "dangerouslySetInnerHTML",
                value: {
                  type: "mdxJsxAttributeValueExpression",
                  value: `{__html: ${value}}`,
                  data: {
                    estree: {
                      type: "Program",
                      sourceType: "module",
                      body: [
                        {
                          type: "ExpressionStatement",
                          expression: {
                            type: "ObjectExpression",
                            properties: [
                              {
                                type: "Property",
                                kind: "init",
                                method: false,
                                shorthand: false,
                                computed: false,
                                key: { type: "Identifier", name: "__html" },
                                value: { type: "Literal", value: fence.code },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
            children: [],
          } as unknown as Node,
        ];
      }
      if (["mdx", "jsx", "tsx", "js", "ts"].includes(language)) {
        if (!filePath || !selected.registerInlineReact)
          throw new Error(
            `Rendering ${language} fences requires the Vite preview-code plugin.`,
          );
        return [
          importInlineReactExample(
            file,
            selected.registerInlineReact(fence.code, filePath, {
              format: language as InlinePreviewOptions["format"],
              filename: fence.label,
              files,
              mdxOptions: selected.previewMdxOptions,
            }),
          ),
        ];
      }
      // Source languages without a component runtime render as highlighted code.
      return [{ type: "code", lang: language, value: fence.code } as Node];
    });
    content.splice(
      0,
      content.length,
      ...(styles.length
        ? [
            renderPreviewStyles(
              rendered,
              styles.map((fence) => fence.code).join("\n\n"),
            ),
          ]
        : rendered),
    );
  }
  if (!direct && selected.filesProp && files.length) {
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
  if (direct || selected.sourceProp) {
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
      content.length === children.length
        ? sourceFromPreviewContainer(source, container, header?.offset)
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
    const bodySource = header?.preview || hasLocalSources ? "" : body;
    if (direct) {
      const sourceFiles = bodySource || !files.length
        ? [{ label: "Example.mdx", code: bodySource, language: "mdx" }, ...files]
        : files;
      attributes.push(directivePropAttribute("files", sourceFiles.map(f => ({ label: f.label, code: f.code, ...(f.language ? { language: f.language } : {}) }))));
    }
    if (!direct && selected.sourceProp)
      attributes.push({
        type: "mdxJsxAttribute",
        name: selected.sourceProp,
        value: header?.preview || hasLocalSources ? "" : body,
      });
  }
  if (example) return [example];
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
        "Inline <" +
          asset.tag +
          "> in preview-code requires the Vite preview-code plugin (registerInlineReact).",
      );
    return [
      importInlineReactExample(
        file,
        selected.registerInlineReact(inlineAssetModule(asset), filePath),
      ),
    ];
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
  authoredOffset?: number,
): string | undefined {
  const start = authoredOffset ?? container?.position?.start.offset;
  if (start === undefined) return undefined;
  let end = container?.position?.end.offset;
  if (end === undefined) {
    const width = /^ {0,3}(:{3,})/.exec(source.slice(start))?.[1].length;
    if (!width) return undefined;
    const lines = source.slice(start).split(/(?<=\n)/);
    let offset = start + lines[0].length;
    let fence: string | undefined;
    for (const line of lines.slice(1)) {
      const match = /^ {0,3}(`{3,}|~{3,})(.*)/.exec(line);
      if (match) {
        if (!fence) fence = match[1];
        else if (match[1].startsWith(fence) && !match[2].trim()) fence = undefined;
      } else if (!fence && new RegExp("^ {0,3}:{" + width + "}\\s*$").test(line)) {
        end = offset + line.trimEnd().length;
        break;
      }
      offset += line.length;
    }
  }
  if (end === undefined || end <= start) return undefined;

  const openerEnd = source.indexOf("\n", start);
  if (openerEnd < 0 || openerEnd >= end) return undefined;

  const closerStart = source.lastIndexOf("\n", end - 1) + 1;
  if (
    closerStart <= openerEnd ||
    !/^:{3,}\s*$/.test(source.slice(closerStart, end))
  )
    return undefined;

  return source
    .slice(openerEnd + 1, closerStart)
    .replace(/^(?:[ \t]*\r?\n)+/, "")
    .replace(/(?:\r?\n[ \t]*)+$/, "");
}

function previewLanguage(file: PreviewFile): string {
  const language = (
    file.language ??
    file.label.split(".").at(-1) ??
    ""
  ).toLowerCase();
  return (
    (
      { javascript: "js", typescript: "ts", react: "jsx" } as Record<
        string,
        string
      >
    )[language] ?? language
  );
}
