import { compile } from "@mdx-js/mdx";

/**
 * Merges MoyaForge components with consumer components.
 *
 * Consumer components are applied last so they can override any built-in
 * component by registering the same MDX component name.
 *
 * @param {Record<string, unknown>} defaults
 * @param {Record<string, unknown>} components
 * @returns {Record<string, unknown>}
 */
export function resolveMdxComponents(defaults = {}, components = {}) {
  return {
    ...defaults,
    ...components,
  };
}

/**
 * Creates a component registry that can be extended without mutating the
 * original registry. Later registrations win, which makes user overrides
 * deterministic.
 *
 * @param {Record<string, unknown>} initialComponents
 */
export function createMdxComponentRegistry(initialComponents = {}) {
  let components = { ...initialComponents };

  return {
    /**
     * @param {Record<string, unknown>} nextComponents
     */
    register(nextComponents = {}) {
      components = {
        ...components,
        ...nextComponents,
      };

      return this;
    },

    /**
     * @returns {Record<string, unknown>}
     */
    get() {
      return { ...components };
    },

    /**
     * @param {Record<string, unknown>} overrides
     */
    resolve(overrides = {}) {
      return resolveMdxComponents(components, overrides);
    },
  };
}

/**
 * Compiles MDX using MoyaForge defaults plus caller-provided processor options.
 *
 * Component resolution happens separately at render time so consumers can
 * register or override components without recompiling source.
 *
 * @param {string} source
 * @param {import("@mdx-js/mdx").CompileOptions} options
 */
export async function compileMdx(source, options = {}) {
  return compile(source, {
    outputFormat: "function-body",
    ...options,
  });
}
