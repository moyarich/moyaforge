# MoyaForge framework architecture

MoyaForge is a **React-first framework** for documentation sites, interactive examples, and arbitrary React applications. The same npm dependency must work in all three contexts; consumer files stay in the consumer repository.

## Site modes

```ts
import { defineMoyaForgeConfig } from "@moyarich/moyaforge";

export default defineMoyaForgeConfig({
  mode: "hybrid", // "docs" | "app" | "hybrid"
  site: {
    title: "My Project",
    base: "/my-project/",
    editLink: { repository: "owner/repo", branch: "main" },
  },
  content: {
    docs: "docs",
    examples: "examples",
    api: "api",
  },
});
```

| Mode | Goal | Consumer owns |
| --- | --- | --- |
| `docs` | VitePress-like documentation experience with minimal setup | MDX content, site config, optional overrides |
| `app` | Add MoyaForge primitives to an existing React app | Router, application shell, all non-doc pages |
| `hybrid` | Embed a documentation section alongside a normal React playground/application | App routes + docs mounts and app features |

**Current implementation:** The configuration modes and metadata above are the first foundation. They do **not** yet create routes, compile MDX, or generate a full site automatically. Those behaviors require the framework integrations outlined below.

## Target package layers

```text
@moyarich/moyaforge
  React components, MDX component registry, headless navigation/content helpers
@moyarich/moyaforge/vite       (planned)
  Vite plugin: MDX discovery/compilation, Shiki, heading IDs, metadata, HMR
@moyarich/moyaforge/react      (planned)
  DocsProvider, DocsLayout, DocsRoutes, optional React Router adapter
moyaforge CLI                  (planned)
  init, dev, build, preview (delegates to Vite)
```

Do not couple the core package to a particular router, Vite plugin, or existing consuming app. React, React Router, MDX and Monaco are distinct capabilities: users of simple documentation components should not have to install and bundle Monaco.

## Content contract

- Consumers own `docs/`, `examples/`, `api/`, and optional `apps/playground/`.
- MDX page modules expose a predictable title, description, route, source file, heading list, and compiled React component.
- Ordered folder names such as `01-guide/page.mdx` remain supported; ordinary folder names work too.
- Vite adapter discovers documents at build time; the public core consumes a normalized manifest, not `import.meta.glob` itself.
- The same manifest supplies navigation, search, breadcrumbs, outline, next/previous links, and edit-source URLs.
- Compiled MDX can render consumer React components without an iframe or second app runtime.
- Shiki is a compile-time transformation. `CodeGroup` and `CodeTab` are ordinary React components. Monaco is an optional lazy-loaded interactive component.

## Desired consumer experience

### Turnkey docs site

```text
project/
  moyaforge.config.ts
  docs/page.mdx
  docs/getting-started/page.mdx
  package.json
```

Install MoyaForge, initialize a docs site and run a dev/build command. In `docs` mode, default navigation, responsive article layout, outline, search UI, edit links and syntax highlighting should work without consumers manually wiring them.

### Existing React application

```tsx
import { CodeGroup, CodeTab, DocOutline } from "@moyarich/moyaforge";

// Use any primitive inside an ordinary React component.
// A future DocsRoutes adapter can mount an MDX section at /docs/*
// without taking over the rest of the application's router.
```

The host app may keep `/`, `/dashboard/*`, and `/playground/*` under its existing routing while a MoyaForge docs section occupies `/docs/*`.

### Hybrid documentation + playground

```text
apps/playground/             # host React/Vite app
docs/                       # source-of-truth documentation
examples/                   # copyable examples
moyaforge.config.ts
```

No generated playground duplicates should be required. Interactive React components, Monaco examples, and compiled MDX can appear on the same page.

## Framework requirements before claiming feature parity

1. **Vite adapter:** discover MDX files, compile Shiki-enhanced code, generate stable heading IDs and source metadata; support dev hot reload and production builds.
2. **Docs theme/layout:** ready-made responsive three-column shell with left navigation and sticky `DocOutline`, but replaceable headlessly.
3. **Routing adapter:** map filesystem pages to URL paths, preserve consumer routes, handle base paths and 404s; generate pre-rendered pages or a static deployment strategy for GitHub Pages.
4. **Search:** client-side index for static sites, optional server/remote adapters.
5. **CLI/templates:** zero-config docs starter, opt-in React integration, and hybrid Vite playground starter.
6. **Integration tests:** build a real docs-only consumer and a React playground consumer using the published package interface; check docs links, edit-source URLs, route refresh and base path deployment.

**Release boundary:** Do not advertise `moyaforge dev/build/preview` or zero-config docs routing until those integrations exist and are exercised in consumer fixtures.

## Keep the boundaries clear

MoyaForge supplies the reusable engine and optional default site experience. Applications supply their own branding, page content, React components, and integrations. `apps/playground` is a consumer example, not a hidden mandatory runtime dependency.
