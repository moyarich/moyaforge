# Contributing to MoyaForge

See the [Development guide](docs/04-development/page.mdx) for local setup, tests and architecture.

## Component registry maintenance

The installable UI source of truth is `packages/moyaforge-ui/src/components/`.
`bin/build-registry.ts` generates `registry.json` for component installs.
Components import their own CSS. Component-local styles stay beside their source;
shared stylesheets, hooks and utilities install into sibling `styles/`, `hooks/`
and `utils/` directories. The registry includes these files through the importing
component's source graph, without requiring separate stylesheet installation. The manifest is committed to this repository.

To regenerate locally before submitting a PR:

```sh
npm ci --ignore-scripts --include=optional
npm run registry:build
npm run registry:check
npx --yes shadcn@4.21.5 registry validate ./registry.json
```

Include changes to `registry.json` in the same PR as
the source changes. CI checks registry freshness on pull requests.

The [Build component registry](.github/workflows/build-component-registry.yml)
workflow also runs automatically when relevant source, generator, or dependency
files change on `main`. To run it manually, open **Actions → Build component
registry → Run workflow**, select the branch, and run it. It checks out the
selected branch's latest tip, regenerates and validates the registry, and only
commits if generated files changed. The bot commit stages **only**
`registry.json`; a clean run creates no commit.

The workflow uses the default `GITHUB_TOKEN` with `contents: write` and a
normal non-force push. Repository branch protection must permit the
`github-actions[bot]` push for generated changes; the workflow does **not**
bypass protection. A rejected push is a failure to resolve through the normal
PR process. Runs are serialized per branch, and a concurrent update cannot be
overwritten with a force push. Validation failures stop before any commit.
There are no npm tokens or publish steps in this workflow.

## Repository workflows

This npm-workspace repository follows the Console release model and consumes workflow definitions from [moyarich/reusable-workflows](https://github.com/moyarich/reusable-workflows) at `main`.

- **CI:** build, test, typecheck, and inspect the publishable MoyaForge package; separately build the private playground.
- **Release Drafter:** draft package-specific GitHub Releases from changes to `packages/**`.
- **Release package:** manually select a package and version resolution strategy; defaults to a dry run.
- **Publish npm package:** manually publish the public npm package; defaults to a dry run. Configure the repository secret `_NPM_TOKEN` for live npm publication.
- **Reset / Restore:** manual, dry-run-first release recovery for package-scoped releases and tags.
- **Pages:** deploy `apps/playground/dist` to GitHub Pages via the shared reusable Pages workflow.
- **Self-heal:** fix formatting and synchronize the npm lockfile on non-`main` branches.

Local setup and testing instructions live in [Development](docs/04-development/page.mdx). The private playground renders repository-owned [Docs](docs/page.mdx) and the [UI component gallery](packages/moyaforge-ui/docs/page.mdx); component examples stay with their component documentation. Public package changelogs and release drafts are reserved for user-facing package behavior; workflow and test maintenance is documented under Development.

The committed root `package-lock.json` is maintained by the shared lockfile self-heal workflow. Publishable packages live under `packages/`. `apps/playground` remains private and must not be selected for releases.

The GitHub Pages site is built from the private `apps/playground` workspace; package releases target public packages under `packages/`.

## Content discovery vs. component installation

`apps/playground/registry.config.ts` configures authored Markdown/MDX content sources, their navigation, and lazy page loading. The root `registry.json` describes **installable React component source**, generated from `packages/moyaforge-ui/src/components` for the native CLI and shadcn. They are separate registries and cannot be interchanged. See [registry architecture](README-registry.md) and [UI component examples](packages/moyaforge-ui/docs/page.mdx).

## Run the CLI directly from GitHub (unpublished source)

The repository root prepares a self-contained CLI package when npm installs
this Git repository. From a separate consumer repository:

```sh
npm exec --yes --package=github:moyarich/moyaforge -- moyaforge init --template playground --search
npm run dev
```

This uses the GitHub default branch, not the published npm CLI. The root
`prepare` hook builds the CLI workspace and bundles its compiled executable
and templates. Node.js 24.11+ and npm are required. See the
[development guide](docs/04-development/page.mdx#running-directly-from-github)
for local-path, link, and tarball alternatives.
