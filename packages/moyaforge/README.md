# @moyarich/moyaforge

Headless documentation framework helpers for React applications. The package provides routing, documentation links, framework config and content helpers without bundling the UI library.

## Installation

```sh
npm install @moyarich/moyaforge @moyarich/moyaforge-mdx
```

For a ready-to-use project, see the [CLI guide](https://github.com/moyarich/moyaforge/tree/main/packages/moyaforge-cli).

## Public entry points

- `@moyarich/moyaforge` — `defineMoyaForgeConfig`, content/navigation helpers, `RegistryRouteView`, and `HeadlessDocsRoutes`.
- `@moyarich/moyaforge/headless` — documentation links, routing hooks, source-driven routes and route lookup utilities.
- `@moyarich/moyaforge/registry-routes` — `RegistryRoutes`, which renders the pages discovered by the MDX Vite registry.

## Documentation routing

Configure discovery with `createContentDiscovery` and `mdxRegistryPlugin` from `@moyarich/moyaforge-mdx/vite`. In a React Router application, render discovered pages using:

```tsx
import { RegistryRoutes } from "@moyarich/moyaforge/registry-routes";
import { DocumentationLink } from "@moyarich/moyaforge/headless";

// Add <RegistryRoutes /> under your existing React Router and
// map MDX anchors to DocumentationLink in your MDX provider.
```

## Related packages

- `@moyarich/moyaforge-mdx` owns Markdown/MDX compilation, content discovery and Vite registry plugins.
- `@moyarich/moyaforge-ui` supplies separately installable UI components and styles.
- `@moyarich/moyaforge-monaco` optionally supplies Monaco worker setup, TypeFox setup and Monaco-specific Vite type declarations.
- `@moyarich/moyaforge-search-sqlite` provides optional search integration.
- Consuming applications own branding, routes, MDX provider and runtime setup.

Legacy `./docs`, `./mdx`, `./code`, `./vite`, and `./components.css` framework exports are no longer published. Use the packages above instead.
