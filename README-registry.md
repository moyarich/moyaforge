# MoyaForge component registry

Install editable React components into your own application. The registry includes component source, CSS and required shared files.

## Install components

```sh
npx @moyarich/moyaforge-cli@latest init
npx @moyarich/moyaforge-cli@latest add code-block
```

Browse the [component gallery](packages/moyaforge-ui/docs/page.mdx) and see the [CLI guide](packages/moyaforge-cli/README.md) for options. The component registry installs source files; it is distinct from the content registry that discovers Markdown and MDX pages.

## Installation targets

```text
src/components/
├── ui/      # Component source and component-local CSS
├── hooks/   # Shared React hooks
├── utils/   # Shared utilities
└── styles/  # Shared CSS imported by components
```

The native CLI recognizes these four target categories. Shared files are included in the importing component's registry item and preserve relative imports. With a custom UI directory such as `src/custom-components/ui`, the shared directories become siblings under `src/custom-components/`. Directories are created only when an installed item needs them. CSS files are copied as source, not injected into a global stylesheet.

## Maintaining the registry

See [registry maintenance](CONTRIBUTING-registry.md) for generator configuration and CI.
