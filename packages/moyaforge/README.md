# @moyarich/moyaforge

Reusable infrastructure for MoyaForge-powered documentation sites and interactive
playgrounds.

MoyaForge uses the standard MDX component/provider model rather than maintaining a
separate component registry.

## MDX components

```jsx
import { MDXProvider } from "@mdx-js/react";
import {
  createMdxComponents,
  moyaForgeComponents,
} from "@moyarich/moyaforge";

const components = createMdxComponents(moyaForgeComponents, {
  Demo,
  Callout: ProjectCallout,
});

<MDXProvider components={components}>
  <Page />
</MDXProvider>;
```

Consumer components are applied after MoyaForge defaults, so a component with the same
name overrides the built-in implementation.

Consumers can also use the same component map with the MDX v3
`useMDXComponents` convention.

## Repository layout

MoyaForge keeps reusable infrastructure in `packages/moyaforge`. The repository's
own usage examples live in `apps/playground`.

A consuming repository can keep its own content wherever it wants. The defaults are:

```text
apps/playground/src/
docs/
api/
```

Use `defineMoyaForgeConfig()` to override those paths.
