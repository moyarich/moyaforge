/** Command syntax and options shown by the CLI help command. */
export const usage = `Usage: moyaforge <init|add|list|dev|build|preview> [options]

init                 Create a runnable React/Vite/MDX app
add <items...>       Copy editable components and CSS from the registry
list                 List registry items

--cwd <path>         Consumer project directory (default: current directory)
--registry <source>  Registry directory or registry.json URL
--directory <path>   Component destination (default: src/components/ui)
--mode source|package   init: editable source (default) or npm-managed UI
--template docs|hybrid|existing   init: starter template (default: docs)
--search             init: opt into SQLite search
--dry-run            Show planned writes and dependencies; change nothing
--diff               Show current and proposed content for differing files
--overwrite          Explicitly replace existing files
--no-install         Write files without running npm install

Existing edits are preserved by default. Components import their own CSS.
For existing apps, use --template existing to create an isolated docs entry.
`;
