import type { Root, RootContent } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";
import { visit } from "unist-util-visit";

/**
 * Render arbitrary container directives as styling-neutral custom blocks.
 * Presentation is deliberately owned by the consuming application.
 */
export function remarkCustomBlocks() {
  return (tree: Root) => {
    visit(tree, "containerDirective", (node: ContainerDirective) => {
      // Directive names are authored identifiers, not a fixed set of variants.
      // Keep them to safe CSS-token characters and avoid empty/invalid classes.
      const type = node.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
      if (!/^[a-z_]/.test(type)) return;
      const title = node.children[0];
      const hasTitle = title?.type === "paragraph" && !!title.data?.directiveLabel;
      if (hasTitle) {
        title.data = {
          ...title.data,
          hName: "p",
          hProperties: { className: ["custom-block-title"] },
        };
      }
      node.data = {
        ...node.data,
        hName: "div",
        hProperties: {
          className: ["custom-block", type],
          "data-type": type,
        },
      };
    });
  };
}
