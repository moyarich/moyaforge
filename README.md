# MoyaForge

MoyaForge provides reusable infrastructure for repository-owned documentation sites,
interactive playgrounds, MDX rendering, and GitHub Pages deployment.

It does **not** own or generate the files that describe or showcase a consuming
repository. Those files stay with that repository.

## Package

`packages/moyaforge` is the reusable `@moyarich/moyaforge` package.

It provides:

- MoyaForge configuration helpers.
- MDX compilation through `@mdx-js/mdx`.
- A component registry for MDX components.
- Consumer component registration.
- Consumer overrides of MoyaForge-provided components.
- Reusable documentation and playground infrastructure.
- Console-backed output surfaces through `@moyarich/console`, with Console kept as the lower-level independent package.

MoyaForge components are defaults, not locked implementations. Consumers can
register a component under the same MDX name to replace the built-in component.

## Recommended consuming-repository layout

```text
apps/
  playground/
    src/          # host app only; renders repository-owned docs
docs/             # repository-owned documentation, examples and development guides
api/              # optional repository-owned API documentation
```

A repository can organize those folders differently and pass its own build command and
artifact path to the reusable workflow.

### Ordered documentation folders

Documentation folders may be named normally or prefixed with a number when explicit
navigation order is useful. Use `page.mdx` as the page entry point:

```text
docs/
├── page.mdx
├── 01-getting-started/
│   └── page.mdx
├── 02-guides/
│   ├── page.mdx
│   ├── 01-configuration/
│   │   └── page.mdx
│   ├── 02-workflows/
│   │   └── page.mdx
│   └── 03-deployment/
│       └── page.mdx
└── 03-reference/
    ├── page.mdx
    ├── 01-cli/
    │   └── page.mdx
    └── 02-api/
        └── page.mdx
```

Numeric prefixes are optional ordering hints, not a validity requirement. Both
`guides/page.mdx` and `02-guides/page.mdx` are valid; the prefixed form is preferred
when sibling order should be explicit. A root `docs/page.mdx` is the documentation
landing page, and a folder `page.mdx` may coexist with nested child pages.

## Reusable GitHub Pages workflow

From a consuming repository:

```yaml
jobs:
  pages:
    uses: moyarich/moyaforge/.github/workflows/pages.yml@main
    permissions:
      contents: read
      pages: write
      id-token: write
    with:
      build-command: npm run build:playground
      artifact-path: packages/playground/dist
```

The reusable workflow installs dependencies, configures GitHub Pages, runs the caller's
documentation build, uploads the caller's output directory, and deploys it.

## Console package installation

MoyaForge consumes the published `@moyarich/console@^0.1.0` package from the public npm registry. Console is an independent, lower-level dependency, and its `@moyarich/console-core` dependency is installed automatically.

```sh
npm install @moyarich/moyaforge @moyarich/console
```

The repository's `.npmrc` routes `@moyarich` packages to the public npm registry. Public package installation does not require a GitHub Packages token or extra Actions permissions.

## Repository workflows

This npm-workspace repository follows the Console release model and consumes workflow definitions from [moyarich/reusable-workflows](https://github.com/moyarich/reusable-workflows) at `main`.

- **CI:** build, test, typecheck, and inspect the publishable MoyaForge package; separately build the private playground.
- **Release Drafter:** draft package-specific GitHub Releases from changes to `packages/**`.
- **Release package:** manually select a package and version resolution strategy; defaults to a dry run.
- **Publish npm package:** manually publish the public npm package; defaults to a dry run. Configure the repository secret `_NPM_TOKEN` for live npm publication.
- **Reset / Restore:** manual, dry-run-first release recovery for package-scoped releases and tags.
- **Pages:** deploy `apps/playground/dist` to GitHub Pages via the shared reusable Pages workflow.
- **Self-heal:** fix formatting and synchronize the npm lockfile on non-`main` branches.

Local setup and testing instructions live in [Development](docs/development/page.mdx). The private playground renders [Docs](docs/page.mdx) and [Examples](docs/examples/page.mdx) from the repository rather than owning a separate example catalog. Public package changelogs and release drafts are reserved for user-facing package behavior; workflow and test maintenance is documented under Development. 

The committed root `package-lock.json` is maintained by the shared lockfile self-heal workflow. Publishable packages live under `packages/`. `apps/playground` remains private and must not be selected for releases.

The GitHub Pages site is built from the private `apps/playground` workspace; package releases target only `packages/moyaforge`.
