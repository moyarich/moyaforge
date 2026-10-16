# MoyaForge component registry

`../registry.json` is a shadcn-compatible GitHub registry generated from canonical
source under `packages/moyaforge/src/components`. It is not the content-discovery
configuration used by the playground.

Run `npm run registry:build` after changing component imports or adding files.
The generator computes relative-import closure, includes styles and license
notices, declares npm/item dependencies, and writes per-item CSS entry files.
Run `npm run registry:check` to ensure manifests and CSS have not drifted.

`templates/docs-shell.tsx` is an editable composition of canonical UI components,
not a duplicate implementation of those components. `styles/*.css` are generated
import lists; component CSS remains in the canonical package.

Both installers preserve this folder hierarchy at their target so relative
imports resolve without monorepo aliases. Registry file targets default to
`src/components/moyaforge`; native CLI `--directory` can relocate the tree.
Package-managed imports remain available separately from the public npm package.

The native CLI resolves same-repository item dependencies from the selected
registry snapshot. Shadcn GitHub item references resolve their own refs: when
validating a release pinned to a tag, pin the registry dependency references too
if you need the entire graph held to that tag. Default references follow main.

## Automatic builds

The **Build component registry** GitHub workflow runs when canonical UI source,
registry templates, generator code, or dependency manifests change on `main`.
It regenerates the registry and CSS entries, checks freshness, validates the
shadcn schema, and commits only changed generated files. Unchanged output creates
no commit. It can also be run manually on a selected repository branch.

Pull requests still run the freshness check in CI; include generated changes in
the PR (`npm run registry:build`) so consumers and reviewers see the complete
result before merge. The automatic main-branch workflow provides a maintenance
backstop. It uses GitHub's repository token without npm publishing credentials,
never force-pushes, and requires repository rules to allow its generated commit.
