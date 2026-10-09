# MoyaForge playground

This app demonstrates how a consuming application uses `@moyarich/moyaforge`.

It intentionally keeps usage code outside the reusable package and shows:

- MoyaForge default MDX components.
- Consumer-provided MDX components.
- Consumer overrides of MoyaForge component names.
- Standard `MDXProvider` composition.

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
  files={[{ name: "example.ts", language: "typescript", value: "export const hello = 'world';" }]}
/>

<EditPageLink repository="moyarich/moyaforge" path="apps/playground/README.md" />
````

**Shiki highlighting is a build-time MDX concern**, not a runtime React component. Configure `rehype-pretty-code` (powered by Shiki) or your preferred MDX highlighting plugin in the consuming site's MDX compiler. MoyaForge's code tabs render its compiled output without imposing a specific build tool.
