# @moyarich/moyaforge-monaco

Optional editor worker integration, independent of the framework and MDX compiler.

```ts
import { monacoReactTypesPlugin } from "@moyarich/moyaforge-monaco/vite";
// Add monacoReactTypesPlugin(projectRoot) to Vite plugins.
```

Import `@moyarich/moyaforge-monaco/react/auto` to configure Monaco workers, or `@moyarich/moyaforge-monaco/typefox/auto` for TypeFox. Explicit setup functions are exported by `/react` and `/typefox`. Install the appropriate optional peer dependencies. Configure only one global Monaco worker provider at a time.

Add `@moyarich/moyaforge-monaco/virtual` to the TypeScript `types` list when importing `virtual:moyaforge-monaco/react-types`.
