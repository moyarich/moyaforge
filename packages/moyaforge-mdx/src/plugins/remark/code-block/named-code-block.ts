import type { DirectiveNode } from "../remark-directive/directive-node.js";

/** Convert a named Markdown fence into a source tab. */
export function namedCodeBlock(node: DirectiveNode) {
  if (node.type !== "code") return;
  const label = /(?:^|\s)filename="([^"]+)"/.exec(node.meta ?? "")?.[1];
  if (label)
    return { label, code: node.value ?? "", language: node.lang || undefined };
}
