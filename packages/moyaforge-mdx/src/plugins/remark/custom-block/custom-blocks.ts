import { normalizeDirectiveType } from "../remark-directive/directive-node.js";

/**
 * Presentation-neutral mapping for arbitrary ::: type Title custom blocks.
 *
 * No type enumerations: consumers own the styling for every generated class.
 */
export const customBlockOptions = {
  containerTagName: "div",
  containerClassName: (type?: string) => [
    "custom-block",
    ...(type ? [normalizeDirectiveType(type)] : []),
  ],
  containerProperties: (type?: string) =>
    type ? { "data-type": normalizeDirectiveType(type) } : {},
  titleTagName: "p",
  titleClassName: "custom-block-title",
};
