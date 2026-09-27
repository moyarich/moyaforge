# @moyarich/moyaforge

Reusable helpers and components for repository-owned documentation sites and
interactive playgrounds.

MoyaForge provides building blocks rather than requiring one application shell.
Consumers can use the provided components, compose an optional shell, or build a
completely custom shell.

## Content helpers

```js
import {
  buildNavigation,
  createPages,
  filterPages,
} from "@moyarich/moyaforge";

const modules = import.meta.glob("./docs/**/page.mdx", { eager: true });
const pages = createPages(modules);
const navigation = buildNavigation(pages);
const matches = filterPages(pages, "configuration");
```

Ordered folder names such as `01-getting-started` and `02-guides` are sorted
numerically while their generated labels omit the numeric prefix.

The helpers return ordinary data. Routing, selection state, rendering, and shell
layout remain under consumer control.

## Components

MoyaForge exports composable primitives including:

- `NavigationTree`
- `Sidebar` with `Header`, `Content`, `Section`, `Footer`, `Group`, and `Item` composition primitives
- `Search`
- `TableOfContents`
- `Page`
- `Demo`
- `Source`
- `CopyButton`

Use them independently. A repository does not need to adopt a MoyaForge shell to
use a MoyaForge component.

The sidebar primitives intentionally ship without an imposed visual theme. They
provide accessible structure and composition points for nested navigation,
collapsible groups, counts, filtering controls, and active items. Consumers can
keep their own classes, icons, renderers, and CSS. This allows an existing site
such as Console to migrate to MoyaForge without changing its appearance.

```jsx
import {
  NavigationTree,
  Source,
  buildNavigation,
} from "@moyarich/moyaforge";

const navigation = buildNavigation(pages);

export function CustomShell() {
  return (
    <MyLayout
      navigation={
        <NavigationTree
          items={navigation}
          renderLink={(page) => <MyLink page={page} />}
        />
      }
    >
      <Source code={source} language="css" />
    </MyLayout>
  );
}
```

## MDX components

MoyaForge uses the standard MDX component/provider model.

```jsx
import { MDXProvider } from "@mdx-js/react";
import {
  createMdxComponents,
  moyaForgeComponents,
} from "@moyarich/moyaforge";

const components = createMdxComponents(moyaForgeComponents, {
  Demo: ProjectDemo,
  Callout: ProjectCallout,
});

<MDXProvider components={components}>
  <Page />
</MDXProvider>;
```

Consumer overrides are applied after defaults, so repositories can replace any
provided MDX component.

## Ownership boundary

MoyaForge owns reusable mechanisms: content discovery helpers, ordered paths,
navigation data, MDX plumbing, and reusable presentation primitives.

The consuming repository owns its documentation and demo content, branding,
routing decisions, application-specific behavior, and final shell composition.

## Repository layout

Content can live wherever the consuming repository chooses. The default paths are:

```text
apps/playground/src/
docs/
api/
```

Use `defineMoyaForgeConfig()` to override them.


## Styling components

Import the optional default component styles:

```js
import "@moyarich/moyaforge/components.css";
```

Component CSS uses one consistent custom-property contract:

```css
/* Public consumer API */
--sidebar-background
--search-background
--source-padding
--demo-border-radius
--page-max-width
--toc-color
--copy-button-background
--navigation-tree-indent

/* Matching private implementation aliases */
--_sidebar-background
--_search-background
--_source-padding
--_demo-border-radius
--_page-max-width
--_toc-color
--_copy-button-background
--_navigation-tree-indent
```

The underscore is the only naming distinction. Consumers set the public
`--component-*` properties. The matching `--_component-*` properties are
internal implementation details.

There is no MoyaForge namespace on CSS custom properties. This keeps existing
themes easy to map without forcing MoyaForge-specific design tokens.


### Composable sidebar

`Sidebar` does not insert a content wrapper or require navigation behavior. Compose
only the regions needed by the consuming application:

```jsx
<Sidebar>
  <Sidebar.Header>
    <Search />
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Section title="Guides">
      <NavigationTree items={guides} />
    </Sidebar.Section>
  </Sidebar.Content>

  <Sidebar.Footer>
    <RepositoryLink />
  </Sidebar.Footer>
</Sidebar>
```

The same primitives are also available as named exports such as
`SidebarHeader`, `SidebarContent`, and `SidebarFooter`. Search and
NavigationTree remain independent components.


## TypeScript

MoyaForge is a TypeScript React package authored in strict TypeScript. Each React component owns a directory under `src/components/*/*`, with its implementation and local `index.ts` barrel. The root `components/index.ts` composes those exports. The package build emits JavaScript and
declaration files to `dist/`, so consumers receive runtime JavaScript together
with first-class TypeScript types.

```sh
npm run typecheck --workspace @moyarich/moyaforge
npm run build --workspace @moyarich/moyaforge
npm test --workspace @moyarich/moyaforge
```
