import type { DirectiveHeader } from "./directive-node.js";
import type { DirectiveHeaderRule } from "./remark-directive-parser.js";

export function spacedHeaderRule(
  supportedFlags: readonly string[],
  readAttributes: (attributes: string) => Partial<DirectiveHeader> = () => ({}),
): DirectiveHeaderRule {
  return (tail, width) => {
    if (width < 3) return;
    const bracketed = /^\s*([\w-]+)\[([^\]]*)\]\s*(?:\{([^{}]*)\})?\s*$/.exec(
      tail,
    );
    const flagged = /^\s*([\w-]+)(?:\s+(.*?))?\s*\{([\w-]+)\}\s*$/.exec(tail);
    const match =
      bracketed ??
      (flagged && supportedFlags.includes(flagged[3]) ? flagged : undefined);
    if (!match) return;
    const attributes = match[3] ?? "";
    return {
      type: match[1],
      title: match[2],
      flags: attributes.trim().split(/\s+/).filter(Boolean),
      ...readAttributes(attributes),
    };
  };
}
