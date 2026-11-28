import type { NestedDirectiveOptions } from "../plugins/remark/code-group/nested-directive-options.js";
import { resolveNestedDirective } from "../plugins/remark/code-tab/resolve-nested-directive.js";
import {
  remarkRenderMappedDirectives,
  type DirectiveComponent as ComponentMapping,
} from "../plugins/remark/remark-directive/remark-map-directives-to-components.js";
import {
  collectPreviewContent,
  type PreviewComponentOptions,
} from "../plugins/remark/preview-code/collect-preview-content.js";

export interface DirectiveComponent
  extends ComponentMapping, PreviewComponentOptions, NestedDirectiveOptions {}
export type DirectiveComponentMap = Record<string, DirectiveComponent>;

/**
 * Map authored directives to host MDX components using the shared preview and nested-directive handlers.
 * Collects preview content where configured and inserts generated inline React imports at the beginning of the document.
 * @param mappings - Directive names mapped to component and preview configuration.
 * @returns A remark transformer that modifies the Markdown AST in place.
 */
export function remarkMapDirectivesToComponents(
  mappings: DirectiveComponentMap,
) {
  const render = remarkRenderMappedDirectives<DirectiveComponent>(
    mappings,
    (mapping, children, header, file, source, attributes, path, container) =>
      mapping.directPreviewCode || mapping.sourceProp || mapping.filesProp || mapping.localSources || mapping.resolvePreviewCodeComponent || mapping.registerInlineReact
        ? collectPreviewContent(mapping, children, header, file, source, attributes, path, container)
        : children,
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
