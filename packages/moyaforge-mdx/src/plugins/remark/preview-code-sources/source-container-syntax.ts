import type { DirectiveHeaderRule } from "../remark-directive/remark-directive-parser.js";

export const parseSourceContainer: DirectiveHeaderRule = (tail, width) => {
  if (width < 3) return;
  const match =
    /^preview-code-sources\{files="([^"]+)"(?:\s+replacements="(portable)")?\}$/.exec(
      tail.trim(),
    );
  if (match)
    return {
      type: "preview-code-sources",
      flags: [],
      sources: match[1],
      replacements: match[2],
    };
};
