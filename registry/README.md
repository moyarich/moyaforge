# MoyaForge component registry

`../registry.json` is a shadcn-compatible GitHub registry generated from canonical
source under `packages/moyaforge/src/components`. It is not the content-discovery
configuration used by the playground.

Run `npm run registry:build` after changing component imports or adding files.
The generator discovers component folders (including nested folders) with an
`index.ts` or `index.tsx` entry and all `.ts`/`.tsx` compositions in
`registry/templates`. Names come from the folder/template filename in kebab case;
collisions fail generation. A new component needs no central registration list.

It parses imports, re-exports, type imports, and literal dynamic imports to collect
each item’s complete source graph. External dependency ranges come from the UI
package’s dependencies and peer dependencies; undeclared dependencies fail the
build. Each item includes its own complete file graph, styles, and license notice;
shared files have identical targets so installers can preserve existing edits.
Unused generated CSS entries are removed when components disappear.
Run `npm run registry:check` to ensure manifests and CSS have not drifted.

`templates/docs-shell.tsx` is an editable composition of canonical UI components,
not a duplicate implementation of those components. `styles/*.css` are generated
import lists; component CSS remains in the canonical package.

Both installers preserve this folder hierarchy at their target so relative
imports resolve without monorepo aliases. Registry file targets default to
`src/components/moyaforge`; native CLI `--directory` can relocate the tree.
Package-managed imports remain available separately from the public npm package.

Generated items are self-contained and do not reference other registry items,
so installing a GitHub item at a tag or commit pins its entire source graph.
The native CLI also supports same-repository dependencies in external manifests.

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
