# CLI development

The CLI uses independent Commander command factories under `src/<command>/*-cli.ts`, assembled by `src/bin/cli.ts`. Command handlers live alongside their factories.

`src/scaffold.ts` plans starter-file writes and manifest updates; `src/dependencies.ts` merges required package dependencies while keeping consumer versions and scripts. `src/registry.ts` exposes `planComponentInstallation()`, which plans registry source writes without mutating the project. Shared consumer resolution and plan execution live in `src/utils/install-plan.ts`.

## Build and test

From the repository root:

```sh
npm run build --workspace @moyarich/moyaforge-cli
npm run typecheck --workspace @moyarich/moyaforge-cli
npm test --workspace @moyarich/moyaforge-cli
npm run registry:check
```

Vite produces the Node executable and registry API under `dist/`, while TypeScript emits declarations. The public package contains `dist/`, `templates/`, the package README, and the changelog. `prepack` builds the package automatically.

## Template organization

The CLI recursively reads starter files from `templates/base/`. With `--search`, files in `templates/search/` overlay matching base paths. Documentation pages come from `templates/docs/`. The default package manifest is `templates/base/package.json`, with additional dependencies selected by the CLI.

The packaged file `templates/base/tsconfig.json.template` is written as `tsconfig.json` in consumer projects. Files belonging to the CLI are read directly; consumer files are inspected before changes are applied.

Add starter files to the template directories so the CLI discovers them automatically.

## Publishing

This CLI is published separately from `@moyarich/moyaforge`; the framework package does not own the executable. Check package exports, registry freshness, and the npm tarball before release. Publish the dependent MDX/framework/search packages as required before publishing or advertising a CLI version that uses them. Merging code is not the same as publishing an npm package.
