# MoyaForge

MoyaForge provides reusable infrastructure for repository-owned documentation sites,
interactive playgrounds, and GitHub Pages deployment.

It does **not** own or generate the files that describe or showcase a consuming
repository. Those files stay with that repository.

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

## Package

`packages/MoyaForge` contains shared configuration helpers. It contains no
Console-specific examples, API pages, documentation, or playground source.
