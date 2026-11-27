import type { Root } from "mdast";
import type { VFile } from "vfile";
import { authoredAttributeText, readDirectiveAttributes } from "../remark-directive/directive-attributes.js";
import { customBlockOptions } from "./custom-blocks.js";
import type { DirectiveNode } from "../remark-directive/directive-node.js";

/** Adapt native directive nodes to the shared container representation. */
export function remarkNormalizeDirectiveNodes() {
  return (tree: Root, file: VFile) => {
    const source = file.toString();
    const visit = (node: DirectiveNode): void => {
      if (
        (node.type === "containerDirective" || node.type === "leafDirective") &&
        node.name
      ) {
        const name = node.name;
        const attrs = node.attributes ?? {};
        const label = node.children?.[0];
        const title = label?.data?.directiveLabel
          ? label.children?.map((child) => child.value ?? "").join("")
          : undefined;
        if (label?.data?.directiveLabel) {
          label.data.hProperties = {
            className: customBlockOptions.titleClassName,
          };
          label.data.hName = customBlockOptions.titleTagName;
        }
        const start = node.position?.start.offset;
        const line = start === undefined ? "" : source.slice(start).split(/\r?\n/, 1)[0];
        const authored = authoredAttributeText(line);
        const parsed = authored === undefined
          ? { props: Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key, value === null || value === "" ? true : value])), flags: Object.keys(attrs).filter(key => attrs[key] === "" || attrs[key] === null) }
          : readDirectiveAttributes(authored);
        node.directiveHeader = {
          title,
          ...parsed,
        };
        node.type = "container";
        node.data = {
          hName: customBlockOptions.containerTagName,
          hProperties: {
            ...customBlockOptions.containerProperties(name),
            className: customBlockOptions.containerClassName(name),
          },
        };
      }
      if (node.type === "container") {
        const label = node.children?.[0];
        const value = label?.data?.hProperties?.className;
        const classes = typeof value === "string" ? value.split(/\s+/) : value;
        if (
          label &&
          Array.isArray(classes) &&
          classes.includes(customBlockOptions.titleClassName)
        ) {
          label.data = { ...label.data, directiveLabel: true };
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree as unknown as DirectiveNode);
  };
}
