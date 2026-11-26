import { createHash } from "node:crypto";
import type { DirectiveNode } from "../remark-directive/directive-node.js";

/** Scope selected styles to this preview and compile CSS as inert text. */
export function renderPreviewStyles(
  content: DirectiveNode[],
  css: string,
): DirectiveNode {
  const className = `mf-preview-fence-${createHash("sha256").update(css).digest("hex").slice(0, 12)}`;
  const stylesheet = `@scope (.${className}) {\n${css}\n}`;
  return {
    type: "mdxJsxFlowElement",
    name: "div",
    attributes: [
      { type: "mdxJsxAttribute", name: "className", value: className },
    ],
    children: [
      {
        type: "mdxJsxFlowElement",
        name: "style",
        attributes: [],
        children: [
          {
            type: "mdxTextExpression",
            value: JSON.stringify(stylesheet),
            data: {
              estree: {
                type: "Program",
                sourceType: "module",
                body: [
                  {
                    type: "ExpressionStatement",
                    expression: { type: "Literal", value: stylesheet },
                  },
                ],
              },
            },
          },
        ],
      },
      ...content,
    ],
  } as unknown as DirectiveNode;
}
