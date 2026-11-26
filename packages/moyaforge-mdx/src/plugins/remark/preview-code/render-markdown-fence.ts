import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkFlexibleContainers from "remark-flexible-containers";
import { customBlockOptions } from "../custom-block/custom-blocks.js";
import { remarkNormalizeDirectiveNodes } from "../custom-block/remark-normalize-directive-nodes.js";
import type { DirectiveNode } from "../remark-directive/directive-node.js";

/** Parse selected Markdown as content, preserving callout and GFM behavior. */
export function renderMarkdownFence(source: string): DirectiveNode[] {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkFlexibleContainers, customBlockOptions)
    .use(remarkNormalizeDirectiveNodes);
  const tree = processor.runSync(processor.parse(source));
  return tree.children as DirectiveNode[];
}
