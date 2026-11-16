import type { DirectiveHeader } from "../remark-directive/directive-node.js";

const PREVIEW_ATTRIBUTES = ["component", "code", "language"] as const;

export function readPreviewAttributes(
  value: string,
): Pick<DirectiveHeader, (typeof PREVIEW_ATTRIBUTES)[number]> {
  const attributes: Partial<DirectiveHeader> = {};
  for (const name of PREVIEW_ATTRIBUTES) {
    const pattern = new RegExp(`(?:^|\\s)${name}="([^"]+)"`, "g");
    const matches = [...value.matchAll(pattern)];
    if (matches.length > 1)
      throw new Error(`Duplicate code-preview ${name} attribute.`);
    const attribute = matches[0]?.[1];
    if (attribute !== undefined)
      Object.assign(attributes, { [name]: attribute });
  }

  if (attributes.component && attributes.code)
    throw new Error(
      "code-preview accepts either a component or code source, not both.",
    );
  if (attributes.language && !attributes.code)
    throw new Error(
      "The code-preview language attribute requires a code source.",
    );
  if (
    attributes.language &&
    !/^[a-zA-Z0-9_-]+$/.test(attributes.language)
  )
    throw new Error("Invalid code-preview language.");

  return attributes;
}
