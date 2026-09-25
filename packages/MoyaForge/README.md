# @moyarich/moyaforge

Shared configuration helpers for MoyaForge-powered documentation and playground
workflows.

MoyaForge does not contain the consuming repository's docs, API pages, examples, or
playground source. Those remain in the consuming repository.

The default layout is:

```text
packages/playground/src/
docs/
api/
```

Use `defineMoyaForgeConfig()` to override paths without moving repository-owned
content into MoyaForge.
