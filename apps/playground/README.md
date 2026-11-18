# MoyaForge playground

This private Vite/React app is the **renderer** for repository-owned documentation and examples. Content lives in [../../docs](../../docs); the app does not maintain a separate component/example catalog.

## Run locally

From the repository root (Node.js 24):

```sh
npm ci
npm run dev
```

Production build and preview:

```sh
npm run build:playground
npm run preview --workspace @moyarich/moyaforge-playground
```

## Architecture

- `registry.config.ts` registers `../../docs`, package-owned `page.md`/`page.mdx` sources, and UI component docs. Package `README.md` files remain in the repository for GitHub and npm; they are intentionally excluded from the documentation registry.
- `src/App.tsx` renders metadata and lazy MDX modules inside the public routing and documentation shell APIs.
- The sidebar and outline use explicit slots with registry-driven navigation, version information, and page-specific feedback.
- `src/mdx-provider.tsx` registers reusable components and common Lucide icons for authored MDX.
- `../../docs/page.mdx` and package-owned `page.mdx` files own visible documentation and examples.
- `../../docs/04-development/page.mdx` owns maintainer setup and tests; its nested pages document content discovery, package integrations, and code-preview internals.

The private app is not a published package and its maintenance belongs in Development docs, not a public package changelog.
