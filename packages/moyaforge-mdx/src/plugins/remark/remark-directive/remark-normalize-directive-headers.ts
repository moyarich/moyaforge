import type { Processor } from "unified";
import {
  remarkDirectiveParser,
  type DirectiveHeaderRule,
} from "./remark-directive-parser.js";

export function remarkNormalizeDirectiveHeaders(
  this: Processor,
  headerRules: readonly DirectiveHeaderRule[] = [],
) {
  remarkDirectiveParser.call(this, headerRules);
}
