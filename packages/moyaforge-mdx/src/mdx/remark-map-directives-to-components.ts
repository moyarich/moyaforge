import type { NestedDirectiveOptions } from "../plugins/remark/code-group/nested-directive-options.js";
import { resolveNestedDirective } from "../plugins/remark/code-tab/resolve-nested-directive.js";
import {
  remarkRenderMappedDirectives,
  type DirectiveComponent as ComponentMapping,
} from "../plugins/remark/remark-directive/remark-map-directives-to-components.js";
import {
  collectPreviewContent,
  type PreviewComponentOptions,
} from "../plugins/remark/code-preview/collect-preview-content.js";

export interface DirectiveComponent
  extends ComponentMapping, PreviewComponentOptions, NestedDirectiveOptions {}
export type DirectiveComponentMap = Record<string, DirectiveComponent>;

/** Compose directive handlers for the default MDX compiler. */
export function remarkMapDirectivesToComponents(
  mappings: DirectiveComponentMap,
) {
  const render = remarkRenderMappedDirectives<DirectiveComponent>(
    mappings,
    collectPreviewContent,
    resolveNestedDirective,
  );
  return (...args: Parameters<typeof render>) => {
    const [tree, file] = args;
    file.data.inlineReactImports = [];
    render(...args);
    tree.children.unshift(
      ...(file.data.inlineReactImports as unknown as typeof tree.children),
    );
  };
}
