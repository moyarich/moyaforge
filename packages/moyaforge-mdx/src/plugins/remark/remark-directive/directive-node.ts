import type { VFile } from "vfile";

export interface DirectiveHeader {
  title?: string;
  flags: string[];
  example?: string;
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
export type DirectiveAttribute = {
  type: "mdxJsxAttribute";
  name: string;
  value: string | null;
};
