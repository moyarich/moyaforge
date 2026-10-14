# MoyaForge playground

The private `@moyarich/moyaforge-playground` workspace app is an interactive React/Vite component showcase. It uses the reusable MoyaForge components and the independently published `@moyarich/console` package without copying their implementations.

## Run locally

From the repository root, using Node.js 24:

```sh
npm install
npm run dev --workspace @moyarich/moyaforge-playground
```

To create and preview a production build:

```sh
npm run build --workspace @moyarich/moyaforge-playground
npm run preview --workspace @moyarich/moyaforge-playground
```

The app builds its local MoyaForge workspace dependency before running Vite. Vite writes output to `apps/playground/dist` and honors `VITE_BASE_PATH` for subpath deployment.

## Examples

- Documentation: accessible code tabs, copy buttons, built-in Demo and empty state.
- Consumer overrides: compare the built-in Demo to the registered app override and a custom Callout.
- Console: structured value rendering using the published Console API.
- Responsive, keyboard-operable navigation and scoped app styles.

## MDX integration

`src/mdx-provider.jsx` remains the example of `MDXProvider` composition with `createMdxComponents`. It also demonstrates third-party `ColorShower` registration.

## Documentation UI components

MoyaForge now supplies these React components through `moyaForgeComponents`, so an MDX consumer can render them without local copies:

- `<DocOutline />`: scroll-aware right-side heading outline. Heading elements must have stable `id` attributes (use a remark/rehype heading slug plugin in the consuming MDX build). Optionally pass `rootRef` to scope to an article.
- `<EditPageLink repository="moyarich/moyaforge" path="docs/page.mdx" />`: repository-aware GitHub edit link.
- `<CodeGroup>` / `<CodeTab label="...">`: keyboard accessible tabs for any React/MDX content, including Shiki-highlighted Markdown fences.
- `<MonacoCodeGroup files={[{ name: "file.ts", value: "const x = 1", language: "typescript" }]} />`: existing Monaco abstraction with a default `@monaco-editor/react` renderer and optional `editable`.

Example MDX:

````mdx
<CodeGroup>
  <CodeTab label="npm">

```sh
npm install @moyarich/moyaforge
```

  </CodeTab>
  <CodeTab label="pnpm">

```sh
pnpm add @moyarich/moyaforge
```

  </CodeTab>
</CodeGroup>

<MonacoCodeGroup
  editable
  files={[
    {
      name: "example.ts",
      language: "typescript",
      value: "export const hello = 'world';",
    },
  ]}
/>

<EditPageLink
  repository="moyarich/moyaforge"
  path="apps/playground/README.md"
/>
````

**Shiki highlighting is a build-time MDX concern**, not a runtime React component. Configure `rehype-pretty-code` (powered by Shiki) or your preferred MDX highlighting plugin in the consuming site's MDX compiler. MoyaForge's code tabs render its compiled output without imposing a specific build tool.
