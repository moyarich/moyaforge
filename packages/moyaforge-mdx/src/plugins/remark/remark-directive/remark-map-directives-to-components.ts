import {
  directiveHeader,
  directiveTitle,
  directiveType,
  type DirectiveNode as Node,
  type DirectiveAttribute as Attribute,
  normalizeDirectiveType,
} from "./directive-node.js";
import type { VFile } from "vfile";
import type { Root } from "mdast";

/** Map authored directive types to host-registered MDX components. */
export interface DirectiveComponent {
  component: string;
  /** Attribute receiving the directive's optional heading. Defaults to label. */
  titleProp?: string;
  /** Forward the authored directive type to a generic component. */
  typeProp?: string;
  /** Bare attributes to forward as boolean JSX props. */
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
    const header = node.directiveHeader ?? directiveHeader(first, file);
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
    for (const flag of selected.booleanProps ?? []) {
      if (header?.flags.includes(flag))
        attributes.push({ type: "mdxJsxAttribute", name: flag, value: null });
    }
    const content = definition
      ? transformContent(
          definition,
          children,
          header,
          file,
          source,
          attributes,
          filePath,
        )
      : children;
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
