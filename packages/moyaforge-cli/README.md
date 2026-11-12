# @moyarich/moyaforge-cli

The MoyaForge CLI creates React/Vite/MDX documentation sites and installs editable UI components from the public component registry. Requires Node.js 24.11+ and npm.

## Quick start

```sh
npx @moyarich/moyaforge-cli@latest create
npm run dev
```

Use `create --search` for SQLite-backed documentation search, `create --template hybrid` for an additional playground route, or `create --template existing` to keep an existing React app's entry and scripts separate.

To add components without generating an application:

```sh
npx @moyarich/moyaforge-cli@latest init
npx @moyarich/moyaforge-cli@latest add code-block
```

The CLI installs component source from the MoyaForge registry. Components own their CSS imports, and user modifications are preserved unless `--overwrite` is provided.

## Documentation

See the [CLI documentation](docs/page.mdx) for setup and command options.

- [Create a project](docs/01-create/page.mdx)
- [Install components](docs/02-components/page.mdx)
