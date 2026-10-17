# MoyaForge UI documentation

This directory owns the documentation and interactive examples for installable
components in `packages/moyaforge-ui/src/components/`.

The playground discovers the `ui` content source from
`apps/playground/registry.config.ts` and renders these MDX pages using the
canonical workspace UI source. New `components/<name>/page.mdx` pages become
routable without adding application routes.

Component documentation should provide a working preview, usage, installation,
relevant variations and accessibility guidance. Import canonical component source
through the MDX provider (or directly within the MDX page); do not create
duplicate implementations inside `apps/playground`.

Component registry entries live in the generated root `registry.json` and
their source remains in `src/components`. This docs directory is not part
of the installable component source graph.
