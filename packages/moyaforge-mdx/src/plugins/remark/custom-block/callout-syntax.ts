import type { DirectiveHeaderRule } from "../remark-directive/remark-directive-parser.js";

export const parseCalloutSyntax: DirectiveHeaderRule = (tail, width) => {
  const type =
    width === 2
      ? /^alert\{type=["'](note|tip|info|warning|danger)["']\}$/.exec(
          tail.trim(),
        )?.[1]
      : /^\s*\{\.callout-(note|tip|info|warning|danger)\}\s*$/.exec(tail)?.[1];
  if (type) return { type, flags: [] };
};
