# @moyarich/moyaforge

Reusable infrastructure for MoyaForge-powered documentation sites and interactive
playgrounds.

Consuming repositories continue to own their docs, API pages, examples, and
playground source. MoyaForge owns reusable parsing, configuration, rendering
plumbing, and deployment infrastructure.

## MDX

MoyaForge compiles MDX with `@mdx-js/mdx`.

```js
import { compileMdx } from "@moyarich/moyaforge";

const compiled = await compileMdx(source, {
  remarkPlugins: [],
  rehypePlugins: [],
});
```

Processor options are forwarded to `@mdx-js/mdx`, so consumers can configure
their own remark and rehype plugins.

## Registering components

Create a registry with MoyaForge-provided components, then register application
components:

```jsx
import { createMdxComponentRegistry } from "@moyarich/moyaforge";

const components = createMdxComponentRegistry({
  Callout: MoyaForgeCallout,
  CodeBlock: MoyaForgeCodeBlock,
});

components.register({
  Demo: Demo,
});
```

## Overriding MoyaForge components

User registrations are applied after MoyaForge defaults. A component registered
with the same MDX name replaces the MoyaForge implementation:

```jsx
components.register({
  Callout: MyCallout,
});

const mdxComponents = components.get();
```

Per-render overrides are also supported:

```jsx
const mdxComponents = components.resolve({
  CodeBlock: ProjectCodeBlock,
});
```

This gives consumers three levels of composition:

1. MoyaForge defaults.
2. Consumer-registered components.
3. Per-render overrides.

Later levels win.

## Repository layout

The default consuming-repository layout remains:

```text
packages/playground/src/
docs/
api/
```

Use `defineMoyaForgeConfig()` to override paths without moving
repository-owned content into MoyaForge.
