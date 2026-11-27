import type { DirectiveHeaderRule } from "./remark-directive-parser.js";
import { readDirectiveAttributes } from "./directive-attributes.js";

/** Generic spaced or bracketed header, with no component prop allowlist. */
export function spacedHeaderRule(): DirectiveHeaderRule {
  return (tail, width) => {
    if (width < 3) return;
    const match = /^\s*([\w-]+)(?:\[([^\]]*)\]|\s+(.*?))?\s*\{(.*)\}\s*$/.exec(tail)
      ?? /^\s*([\w-]+)\[([^\]]*)\]\s*$/.exec(tail);
    if (!match) return;
    const type = match[1];
    const { props, flags } = readDirectiveAttributes(match[4] ?? "");
    return { type, title: match[2] ?? match[3], flags, props };
  };
}
