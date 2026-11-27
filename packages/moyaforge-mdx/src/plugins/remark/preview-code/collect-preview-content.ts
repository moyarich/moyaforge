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
  const direct = selected.directPreviewCode === true;

  if (header?.preview && (inlineReact || header.component || header.code))
    throw new Error(
      "preview-code preview cannot be combined with react, component, or code.",
    );
  if (inlineReact && (header?.component || header?.code))
    throw new Error(
      "A {react} preview takes its component and source from the directive body.",
    );
  let example: Node | undefined;
  if (header?.component) {
    if (
      !/^(?:\.\/|\.\.\/)+(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:tsx|jsx)(?:#[A-Za-z_$][\w$]*)?$/.test(
        header.component,
      )
    )
      throw directiveDiagnostic(new Error(`Invalid preview-code component: ${header.component}`), source, filePath ?? "<input>", container?.position?.start.offset, "preview-code", {
        code: "MDX_INVALID_COMPONENT_REFERENCE", phase: "resolve", attribute: "component",
        expected: "Relative .tsx or .jsx path, optionally followed by #ExportName",
        suggestion: 'Use component="./Example.tsx" or component="./Example.tsx#Example".',
      });
    const component =
      filePath &&
      selected.resolvePreviewCodeComponent?.(header.component, filePath);
    if (!component)
      throw directiveDiagnostic(new Error(`Unregistered preview component: ${header.component}`), source, filePath ?? "<input>", container?.position?.start.offset, "preview-code", {
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
  if (direct || selected.sourceProp || inlineReact) {
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
      (inlineReact ? header?.reactBody : undefined) ?? fromContainer ??
      groups
        .map((nodes) => {
          const start = nodes[0]?.position?.start.offset;
          const end = nodes.at(-1)?.position?.end.offset;
          return start === undefined || end === undefined
            ? ""
            : source.slice(start, end);
        })
        .join("\n\n");
    const bodySource = header?.preview || (hasLocalSources && !inlineReact) ? "" : body;
    if (direct) {
      const sourceFiles = bodySource || !files.length
        ? [{ label: inlineReact ? "Example.tsx" : "Example.mdx", code: bodySource, language: inlineReact ? "tsx" : "mdx" }, ...files]
        : files;
      attributes.push(directivePropAttribute("files", sourceFiles.map(f => ({ label: f.label, code: f.code, ...(f.language ? { language: f.language } : {}) }))));
    }
    if (!direct && selected.sourceProp)
      attributes.push({
        type: "mdxJsxAttribute",
        name: selected.sourceProp,
        value: header?.preview || (hasLocalSources && !inlineReact) ? "" : body,
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
          selected.registerInlineReact(
            body,
            filePath,
            { format: "tsx", filename: "preview.tsx", files, reactBody: true },
          ),
        ),
      ];
    }
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
): string | undefined {
  const start = container?.position?.start.offset;
  const end = container?.position?.end.offset;
  if (start === undefined || end === undefined || end <= start)
    return undefined;

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
