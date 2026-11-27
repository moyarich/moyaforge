import { parseCalloutSyntax } from "./custom-block/callout-syntax.js";
import { spacedHeaderRule } from "./remark-directive/spaced-header-rule.js";

export const directiveHeaderRules = [
  parseCalloutSyntax,
  spacedHeaderRule(),
];
