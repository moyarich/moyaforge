# @moyarich/moyaforge-cli

The MoyaForge CLI creates React/Vite/MDX documentation sites and installs editable UI components from the public component registry. Requires Node.js 24.11+ and npm.

## Quick start

```sh
npx @moyarich/moyaforge-cli@latest init --template docs
npm run dev
```

Use `init --template playground --search` to scaffold a standalone registry-based playground comparable to `apps/playground`. Its UI components are sourced through the same registry as `moyaforge add`.

Use `init --template docs --search` for SQLite-backed documentation search, `init --template hybrid` for an additional playground route, or `init --template existing` to keep an existing React app's entry and scripts separate.

To add components without generating an application:

```sh
npx @moyarich/moyaforge-cli@latest init
npx @moyarich/moyaforge-cli@latest add code-block
```

The CLI installs component source from the MoyaForge registry. Components own their CSS imports, and user modifications are preserved unless `--overwrite` is provided.

## Import generated components

The generated Vite and TypeScript configs resolve `@/` to your project's
`src/` directory. With the default component destination, use imports such as
`import { PreviewCode } from "@/components/ui/PreviewCode";`.

The playground template provides `virtual:monaco-react-types` for Monaco
worker setups. It resolves the installed React and CSS type packages from the
generated project's package manifest. The template installs `@types/react`,
`@types/react-dom`, and `csstype` as direct development dependencies. Its
TypeScript config loads the MDX virtual module declarations from
`@moyarich/moyaforge-mdx/vite-client`.

## Documentation

See the [CLI documentation](docs/page.mdx) for setup and command options.

- [Initialize and scaffold a project](docs/init/page.mdx)
- [Install components](docs/add/page.mdx)
