# MoyaForge

Build documentation sites and interactive playgrounds for your projects using React, Vite, Markdown and MDX. Keep your documentation, examples, branding and application code in your own repository.

[Explore the live playground](https://moyarich.github.io/moyaforge/) · [Read the guides](docs/page.mdx) · [Browse UI components](packages/moyaforge-ui/docs/page.mdx)

## Quick start

Requires Node.js 24.11+ and npm. From your project directory:

```sh
npx @moyarich/moyaforge-cli@latest init --template docs
npm run dev
```

Choose a template for your project:

| Template | Use it for |
| --- | --- |
| `docs` | A documentation site |
| `playground` | Interactive examples and demos |
| `hybrid` | Documentation with a playground route |
| `existing` | Adding MoyaForge to an existing React app |

Add `--search` when initializing a site to enable SQLite-backed search. See the [CLI guide](packages/moyaforge-cli/README.md) for options.

## What you can do

- Write Markdown and MDX pages with frontmatter, navigation and tables of contents.
- Showcase interactive React examples and source code.
- Install editable UI components and customize their styles.
- Add documentation search and browser-based code editors.
- Deploy your site to GitHub Pages.

## Packages

| Package | Purpose |
| --- | --- |
| [@moyarich/moyaforge](packages/moyaforge/README.md) | React documentation routing and configuration |
| [@moyarich/moyaforge-cli](packages/moyaforge-cli/README.md) | Scaffold sites and install components |
| [@moyarich/moyaforge-mdx](packages/moyaforge-mdx/README.md) | Markdown/MDX compilation and content discovery |
| [@moyarich/moyaforge-ui](packages/moyaforge-ui/README.md) | React documentation components and styles |
| [@moyarich/moyaforge-monaco](packages/moyaforge-monaco/README.md) | Monaco and TypeFox editor integrations |
| [@moyarich/moyaforge-search-sqlite](packages/moyaforge-search-sqlite/README.md) | SQLite-backed search |

## Install editable components

```sh
npx @moyarich/moyaforge-cli@latest init
npx @moyarich/moyaforge-cli@latest add code-block
```

Components and required styles are copied into your project. You can edit them without changing MoyaForge itself. Existing modifications are preserved unless you request `--overwrite`.

## Organize your documentation

```text
apps/
  playground/
    src/          # host app only; renders repository-owned docs
docs/             # repository-owned documentation and development guides
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

## Try the CLI from GitHub

To try the default branch instead of a published CLI release:

```sh
npm exec --yes --package=github:moyarich/moyaforge -- moyaforge init --template playground --search
npm run dev
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository setup, tests, registry maintenance and release workflows.
