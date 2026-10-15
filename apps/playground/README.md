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

- `registry.config.ts` registers `../../docs` and package-owned page sources.
- `src/components/ContentExplorer.jsx` displays metadata and lazy MDX modules.
- `src/App.jsx` owns only navigation, search, and layout.
- `docs/page.mdx` and `docs/examples/page.mdx` own visible documentation and examples.
- `docs/development/page.mdx` owns maintainer setup and test instructions.

The private app is not a published package and its maintenance belongs in Development docs, not a public package changelog.
