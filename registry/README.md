# MoyaForge component registry

The root [`registry.config.ts`](../registry.config.ts) is the single source
of configuration for registry generation. It selects the component packages,
public names and overrides, dependency manifests, templates, documentation,
install target, and output file. It is **not** the MDX content registry used by
the documentation playground.

`scripts/build-registry/build-registry.ts` exports a reusable, framework-neutral
function. Its Commander CLI loads `registry.config.ts` and passes its settings
to that function. No Vite build is needed: the registry is generated from
component source imports, CSS and package manifests, not compiled artifacts.

## Run from npm, a shell, or the bin

```sh
npm run registry:build
npm run registry:check

node scripts/build-registry/build-registry-cli.ts --config registry.config.ts
node scripts/build-registry/build-registry-cli.ts --config registry.config.ts --check
node scripts/build-registry/build-registry-cli.ts --print-output

# Installed workspace bin (Node 24+):
npm exec -- build-registry --config registry.config.ts

# Restrict discovery to selected packages:
npm run registry:build -- --package packages/moyaforge-monaco

# Override registry metadata, output and installation targets:
npm run registry:build -- \
  --name custom-registry \
  --homepage https://example.com \
  --output-file generated/registry.json \
  --target-dir '~/src/components/ui'

# Select shared dependency manifests or disable optional discovery:
npm run registry:build -- \
  --dependency-manifest packages/example/package.json \
  --no-templates --no-docs --no-legacy-styles
```

The CLI reads `registry.config.ts` first. Explicit options take precedence
without modifying the configuration file. Supported overrides are
`--name`, `--homepage`, repeatable `--package` and
`--dependency-manifest`, `--templates-dir`, `--docs-dir`,
`--output-file`, `--target-dir`, `--legacy-styles-dir`,
`--no-templates`, `--no-docs` and `--no-legacy-styles`.
Use `--check` to validate without writing, and `--print-output` to print
the effective output filename, including any `--output-file` override.

An explicit `--package` selection preserves the corresponding package's
`nameOverrides` from the config. To build a different registry, pass
`--config path/to/other.registry.config.ts`; paths are resolved from
the config file's directory, not the current shell directory.

The GitHub workflow, npm scripts, shell and workspace bin all invoke
the same Commander CLI. Workflows can pass individual overrides through
`npm run registry:build -- --output-file ...` instead of editing the file.

The generator discovers nested component folders with `index.ts` or
`index.tsx` and follows local script and CSS imports. Undeclared dependencies
and duplicate public names are rejected. Items include their complete source
graphs, so ordinary UI components do not pull in Monaco editor source.

## GitHub Actions

[Build component registry](../.github/workflows/build-component-registry.yml)
uses the same CLI, verifies generated content, validates the shadcn schema,
and commits the output file declared by the configuration when changed.
It runs on relevant pushes to `main` and supports manual dispatch.

Pull requests should include regenerated `registry.json` and pass
`npm run registry:check`. This process is independent of `postbuild`
and Vite.
