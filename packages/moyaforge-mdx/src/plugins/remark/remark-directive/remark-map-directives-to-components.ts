import { directiveDiagnostic } from "../../../diagnostics/directive-diagnostic.js";
import { MdxDiagnosticError } from "../../../diagnostics/create-diagnostic.js";
import {
  directiveHeader,
  directiveTitle,
  directiveType,
  type DirectiveNode as Node,
  type DirectiveAttribute as Attribute,
  normalizeDirectiveType,
  previewHeader,
} from "./directive-node.js";
import { directivePropAttribute } from "./directive-attributes.js";
import type { VFile } from "vfile";
import type { Root } from "mdast";

/** Map authored directive types to host-registered MDX components. */
export interface DirectiveComponent {
  component: string;
  /** Attribute receiving the directive's optional heading. Defaults to label. */
  titleProp?: string;
  /** Forward the authored directive type to a generic component. */
  typeProp?: string;
  /** @deprecated Bare attributes are forwarded automatically. */
  booleanProps?: readonly string[];
}

export type DirectiveComponentMap = Record<string, DirectiveComponent>;

export type DirectiveContentTransform<Mapping extends DirectiveComponent> = (
  mapping: Mapping,
  children: Node[],
  header: ReturnType<typeof directiveHeader>,
  file: VFile,
  source: string,
  attributes: Attribute[],
  filePath?: string,
  /** Original source container, used to capture complete authored preview text. */
  container?: Node,
) => Node[];

export type NestedComponentResolver<Mapping extends DirectiveComponent> = (
  type: string | undefined,
  parent?: Mapping,
) => string | undefined;

function jsx(name: string, content: Node[], attributes: Attribute[]): Node {
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes,
    children: content,
  } as unknown as Node;
}

function transform<Mapping extends DirectiveComponent>(
  node: Node,
  mappings: Record<string, Mapping>,
  source: string,
  file: VFile,
  transformContent: DirectiveContentTransform<Mapping>,
  resolveChild: NestedComponentResolver<Mapping>,
  filePath?: string,
  parent?: Mapping,
): Node {
  const type = directiveType(node);
  const nested = resolveChild(type, parent);
  const definition = type
    ? (mappings[type] ?? (nested ? undefined : mappings["*"]))
    : undefined;
  if (definition || nested) {
    const selected: DirectiveComponent = definition ?? { component: nested! };
    const children = [...(node.children ?? [])];
    const first = children[0];
    const parsedTitle = directiveTitle(first);
    const authoredHeader = node.directiveHeader ?? directiveHeader(first, file);
    const isPreview = type === "preview-code" || type === "preview-code-sources";
    let header: ReturnType<typeof directiveHeader>;
    try {
      header = isPreview ? previewHeader(authoredHeader) : authoredHeader;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const attribute = /Invalid preview-code (\w+) attribute/.exec(message)?.[1];
      throw directiveDiagnostic(error, source, filePath ?? "<input>", authoredHeader?.offset ?? node.position?.start.offset, type, {
        code: "MDX_INVALID_DIRECTIVE_ATTRIBUTE",
        phase: "directive",
        attribute,
        expected: attribute ? "A quoted string" : undefined,
        suggestion: attribute ? `Use ${attribute}="value".` : undefined,
      });
    }
    if (parsedTitle !== undefined) children.shift();
    const title = header
      ? header.flags.includes("no-title")
        ? ""
        : header.title
      : parsedTitle;
    const attributes: Attribute[] =
      title !== undefined
        ? [
            {
              type: "mdxJsxAttribute",
              name: selected.titleProp ?? "label",
              value: title,
            },
          ]
        : [];
    if (selected.typeProp && type) {
      attributes.push({
        type: "mdxJsxAttribute",
        name: selected.typeProp,
        value: normalizeDirectiveType(type),
      });
    }
    const reserved = new Set(["no-title"]);
    if (isPreview) for (const name of ["react", "component", "preview", "code", "language", "files", "replacements", "sourceFiles", "replacementPreset", "sourceOnly"]) reserved.add(name);
    for (const [name, value] of Object.entries(header?.props ?? {})) {
      if (reserved.has(name)) continue;
      // Explicit props override the optional heading, not compiler-owned type.
      if (name === selected.typeProp) continue;
      const index = attributes.findIndex(attribute => attribute.name === name);
      const attribute = directivePropAttribute(name, value);
      if (index < 0) attributes.push(attribute);
      else attributes[index] = attribute;
    }
    if (header?.offset !== undefined && node.position?.start.offset === undefined) {
      node.position = { start: { offset: header.offset }, end: {} };
    }
    let content: Node[];
    try {
      content = definition
      ? transformContent(
          definition,
          children,
          header,
          file,
          source,
          attributes,
          filePath,
          node,
        )
      : children;
    } catch (error) {
      if (error instanceof MdxDiagnosticError) throw error;
      throw directiveDiagnostic(error, source, filePath ?? "<input>", authoredHeader?.offset ?? node.position?.start.offset, type, {
        code: "MDX_DIRECTIVE_FAILED", phase: "directive",
      });
    }
    return jsx(
      selected.component,
      content.map((child) =>
        transform(
          child,
          mappings,
          source,
          file,
          transformContent,
          resolveChild,
          filePath,
          definition,
        ),
      ),
      attributes,
    );
  }
  if (node.children)
    node.children = node.children.map((child) =>
      transform(
        child,
        mappings,
        source,
        file,
        transformContent,
        resolveChild,
        filePath,
      ),
    );
  return node;
}

/** Transform only configured directives; all others remain generic HTML containers. */
export function remarkRenderMappedDirectives<Mapping extends DirectiveComponent>(
  mappings: Record<string, Mapping>,
  transformContent: DirectiveContentTransform<Mapping> = (_mapping, children) => children,
  resolveChild: NestedComponentResolver<Mapping> = () => undefined,
) {
  return (tree: Root, file: VFile) => {
    const source = file.toString();
    const root = tree as unknown as Node;
    root.children = (root.children ?? []).map((node) =>
      transform(
        node,
        mappings,
        source,
        file,
        transformContent,
        resolveChild,
        file.path,
      ),
    );
  };
}
