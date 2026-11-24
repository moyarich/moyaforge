import { readPreviewAttributes } from "./preview-code/preview-attributes.js";
import { parseSourceContainer } from "./preview-code-sources/source-container-syntax.js";
import { parseCalloutSyntax } from "./custom-block/callout-syntax.js";
import { spacedHeaderRule } from "./remark-directive/spaced-header-rule.js";

export const directiveHeaderRules = [
  parseCalloutSyntax,
  parseSourceContainer,
  spacedHeaderRule(["refresh", "no-title"], readPreviewAttributes),
];
