import type { VFile } from "vfile";
import type { DirectiveProps, directivePropAttribute } from "./directive-attributes.js";

export interface DirectiveHeader {
  title?: string;
  flags: string[];
  props?: DirectiveProps;
  component?: string;
  preview?: string;
  code?: string;
  language?: string;
  sources?: string;
  replacements?: string;
}

declare module "vfile" {
  interface DataMap {
    directiveHeaders: ReadonlyMap<string, DirectiveHeader>;
  }
}

interface ContainerNode {
  type: string;
  directiveHeader?: DirectiveHeader;
  value?: string;
  children?: ContainerNode[];
  data?: {
    directiveLabel?: boolean;
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

export function directiveType(node: ContainerNode): string | undefined {
  const type =
    node.type === "container" && node.data?.hProperties?.["data-type"];
  return typeof type === "string" ? type : undefined;
}

function text(node: ContainerNode): string {
  return node.value ?? (node.children ?? []).map(text).join("");
}

export function directiveTitle(node?: ContainerNode): string | undefined {
  if (node?.data?.directiveLabel) return text(node);
}

export function directiveHeader(
  node: ContainerNode | undefined,
  file: Pick<VFile, "data">,
) {
  if (node?.directiveHeader) return node.directiveHeader;
  const title = directiveTitle(node);
  return title === undefined
    ? undefined
    : file.data.directiveHeaders?.get(title);
}

/** Prevent user-provided type names from escaping a single CSS class token. */
export function normalizeDirectiveType(type: string): string {
  const normalized = type.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return /^[a-z_]/.test(normalized) ? normalized : `type-${normalized}`;
}

export type DirectiveNode = {
  directiveHeader?: DirectiveHeader;
  name?: string;
  attributes?: Record<string, string | null>;
  type: string;
  children?: DirectiveNode[];
  data?: {
    directiveLabel?: boolean;
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
  value?: string;
  lang?: string;
  meta?: string;
  position?: { start: { offset?: number }; end: { offset?: number } };
};
export type DirectiveAttribute = ReturnType<typeof directivePropAttribute>;

/** Compiler-owned preview syntax is interpreted only for preview directives. */
export function previewHeader(header: DirectiveHeader | undefined): DirectiveHeader | undefined {
  if (!header) return;
  const props = header.props ?? {};
  const string = (name: string) => typeof props[name] === "string" ? props[name] as string : undefined;
  for (const name of ["component", "preview", "code", "language", "files"]) {
    if (Object.hasOwn(props, name) && typeof props[name] !== "string")
      throw new Error("Invalid preview-code " + name + " attribute: expected a string.");
  }
  const result = { ...header, component: string("component"), preview: string("preview"), code: string("code"), language: string("language"), sources: string("files"), replacements: string("replacements") === "portable" ? "portable" : undefined };
  if (result.component && result.code) throw new Error("preview-code accepts either a component or code source, not both.");
  if (result.language && !result.code) throw new Error("The preview-code language attribute requires a code source.");
  if (result.language && !/^[a-zA-Z0-9_-]+$/.test(result.language)) throw new Error("Invalid preview-code language.");
  return result;
}
