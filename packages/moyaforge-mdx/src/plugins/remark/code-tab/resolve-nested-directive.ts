import type { NestedDirectiveOptions } from "../code-group/nested-directive-options.js";

export function resolveNestedDirective(
  type: string | undefined,
  parent?: NestedDirectiveOptions,
): string | undefined {
  if (type && type === parent?.childType) return parent.childComponent;
}
