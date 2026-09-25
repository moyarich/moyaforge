/**
 * Merge MoyaForge defaults with consumer MDX components.
 *
 * Consumers should pass the result to MDXProvider/useMDXComponents.
 * Later entries win, so consumer components override MoyaForge defaults
 * without a custom registry abstraction.
 *
 * @param {Record<string, unknown>} defaults
 * @param {Record<string, unknown>} components
 */
export function createMdxComponents(defaults = {}, components = {}) {
  return {
    ...defaults,
    ...components,
  };
}
