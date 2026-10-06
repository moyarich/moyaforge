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
packages/
  playground/
    src/          # repository-owned playground/site source
docs/             # repository-owned guides and examples
api/              # repository-owned API documentation
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
