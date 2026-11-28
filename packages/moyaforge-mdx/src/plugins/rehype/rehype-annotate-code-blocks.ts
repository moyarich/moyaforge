type Element = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Element[];
};

function languageFromClass(value: unknown): string | undefined {
  const classes = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\s+/)
      : [];
  for (const cls of classes) {
    if (typeof cls !== "string") continue;
    const match = /^language-(.+)$/.exec(cls);
    if (match) return match[1];
  }
  return undefined;
}

/**
 * Annotate pre elements with data-language derived from their code child's language-* class.
 * Preserves existing language annotations. Run before syntax highlighting replaces code elements.
 * @returns A rehype transformer that mutates the HTML tree in place.
 */
export function rehypeAnnotateCodeBlocks() {
  return (tree: Element) => {
    const visit = (node: Element) => {
      if (node.type === "element" && node.tagName === "pre") {
        const code = node.children?.find(
          (child) => child.type === "element" && child.tagName === "code",
        );
        const language = languageFromClass(code?.properties?.className);
        if (language && !node.properties?.["data-language"]) {
          node.properties = { ...node.properties, "data-language": language };
        }
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
  };
}
