# @moyarich/moyaforge-cli

Public Node.js installer and development commands for MoyaForge. Requires Node.js
22.12+ and npm. The installer has no runtime dependencies on React, shadcn,
Tailwind, Radix, Monaco, or the MoyaForge UI package.

## New documentation app

Create a directory, enter it, then run:

```sh
npx @moyarich/moyaforge-cli@latest init
npm run dev
```

The default installs editable source into `src/components/ui`, creates a
React/Vite/MDX application, and installs dependencies. It configures canonical
MDX discovery, GitHub Pages-friendly hash routing, Shiki, clipboard controls,
Lucide icons, and an explicit sidebar/outline composition.

Use `--mode package` to consume the published framework through focused `/docs`
and `/code` exports instead. `--search` adds the independent SQLite Vite plugin
and browser client. `--template hybrid` includes a separate interactive React
route alongside documentation.

## Existing React app

```sh
npx @moyarich/moyaforge-cli@latest init --template existing
npm run docs:dev
```

This writes an isolated entry under `moyaforge/` and adds `docs:*` scripts. It
preserves the host's app entry, Vite config, existing scripts, and declared
dependency versions. Content lives in the host's `docs/` directory. Consumers
can subsequently embed the generated composition inside their existing router
using `MoyaForgeRouting` instead of creating a second router.

## Install individual components

```sh
npx @moyarich/moyaforge-cli@latest list
npx @moyarich/moyaforge-cli@latest add code-block code-group
npx @moyarich/moyaforge-cli@latest add sidebar-v1 sidebar-v2 doc-outline docs-shell
```

Import the installed component directly; its implementation imports its own CSS:

```tsx
import {
  CodeGroup,
  CodeTab,
} from "./components/ui/components/CodeGroup/CodeGroup";
```

Relative source imports retain their canonical folder hierarchy, including when
`--directory ui/moyaforge` changes the installation root. No monorepo alias or
playground import is required. Registry dependencies install transitively;
plain code blocks do not install the framework, MDX tooling, Console, or editors.

## Review and preserve changes

```sh
npx @moyarich/moyaforge-cli@latest add code-group --dry-run --diff
npx @moyarich/moyaforge-cli@latest add code-group --overwrite
```

Existing files are preserved by default. `--overwrite` is the explicit opt-in to
replacement. `--dry-run` performs no writes or package installation; `--diff`
shows the full current and proposed text for differing files. `--no-install`
writes source/configuration only. Initialization merges missing dependencies and
scripts into package.json while preserving existing values. It does not silently
reconfigure an existing host app; use the `existing` template for that case.

`--cwd` selects the consumer directory. `--registry` accepts a local repository
folder, a local registry.json, or a registry.json URL (including a raw GitHub URL
pinned to a tag or commit). Optional `moyaforge.components.json` persists registry
and destination choices for subsequent `add` commands. This installer config and
the repository's root `registry.json` are separate from `registry.config.ts`,
which configures authored content discovery.

## Development commands

`moyaforge dev`, `moyaforge build`, and `moyaforge preview` invoke the consumer's
installed Vite binary. Vite flags are forwarded. The isolated existing-app
configuration is selected automatically when present.

## shadcn-compatible GitHub registry

The same canonical files are available through:

```sh
npx shadcn@latest add moyarich/moyaforge/code-block
npx shadcn@latest add moyarich/moyaforge/docs-shell
```

This uses the public repository's root registry.json; no separate registry server
is required. The shadcn path expects a consumer configured for its CLI. MoyaForge's
native installer does not require that configuration or any Tailwind dependency.
The installed component modules import their own CSS, colocated with their source. No additional stylesheet import or aggregate registry CSS entry is required.

## Publishing and migration

The CLI moves out of `@moyarich/moyaforge`; use
`npx @moyarich/moyaforge-cli@latest` instead of invoking the framework package.
All four runtime/tool packages remain public. The workspace and playground stay
private. Component source stays on GitHub; copied components are not separately
published npm packages.

Align and verify the current `0.1.0` package manifests and public registry artifacts before advertising CLI starter modes. Publish the MDX package before packages that depend on its exports, then publish the framework and standalone search adapter as needed. Publish the CLI and
push the root registry/source files before advertising the commands above.
Merging source does not itself publish packages to npm. Public installs require
no GitHub credentials, and registry dependencies must be public npm packages.

Development validation: `npm run registry:check`, `npm run checks`,
`npm run test:cli:consumer`, and `npx shadcn@4.21.5 registry validate ./registry.json`.

## Building the CLI

The CLI source is TypeScript with JSDoc for its exported APIs. `src/scaffold.ts`
plans starter files and consumer manifest changes for `moyaforge init`.

```sh
npm run build --workspace @moyarich/moyaforge-cli
npm run typecheck --workspace @moyarich/moyaforge-cli
npm test --workspace @moyarich/moyaforge-cli
```

Vite builds the Node command and registry API into `dist/`; TypeScript emits
API declarations. Published packages include the compiled output and the
`templates/` directory. `prepack` builds them automatically.
