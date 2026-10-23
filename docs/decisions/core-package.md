# Decision: defer a separate `moyaforge-core` package

**Status:** Accepted for the current workspace architecture  
**Issue:** #55

## Context

The workspace already has headless functionality owned by its domain:

- `@moyarich/moyaforge-mdx` owns content discovery, normalization, routes, heading metadata, link validation, and navigation tree construction.
- `@moyarich/moyaforge` exposes framework adapters and its existing headless public API.
- `@moyarich/moyaforge-ui` owns React components, their presentation, and component-local behavior.
- `@moyarich/moyaforge-search-sqlite` owns storage-specific search behavior.

Although some page-label and path helpers look similar, they operate over different contracts. Moving them into a new package would introduce a runtime dependency and an additional versioned public surface before multiple actual consumers need the **same** utility.

## Decision

Do **not** introduce `moyaforge-core` solely to centralize apparent duplication. Keep the MDX content manifest and normalization in `moyaforge-mdx`, without React, DOM, editor, or SQLite imports. Existing adapters continue to import their current public APIs.

## Extraction trigger

Revisit this decision if at least two independent packages need precisely the same stable, platform-neutral behavior and importing from its current domain owner would create an inappropriate dependency. Any proposed extraction must:

1. Name both real consumers and the shared contract.
2. Remain free of React, DOM, editor, MDX compiler, and SQLite runtime dependencies.
3. Preserve existing public adapter entry points and behavior.
4. Add cross-package tests establishing API parity before changing imports.
5. Demonstrate that the dependency graph is simpler, not merely more layered.

## Verification

This is a documentation-only architecture decision. No runtime imports, entry points, dependency declarations, or published APIs are changed. The existing package tests remain the behavioral guardrails.

## Related work

The canonical content manifest is tracked in #9; compilation-owned metadata in #194; and TOC/router integration in #98. Keep those changes in their domain packages until a concrete shared primitive meets the extraction trigger.
