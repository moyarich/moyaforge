# Markdown and MDX conventions

MoyaForge documents use `page.mdx` as the route entry point and optional numbered directory prefixes for navigation order. Keep repository-owned content in `docs/` and implementation-specific examples in the consuming application.

```text
docs/
  page.mdx
  01-getting-started/
    page.mdx
  02-guides/
    page.mdx
    01-configuration/
      page.mdx
```

## Frontmatter

Pages should declare a nonempty `label` or `title`. The shared `parseMoyaForgePageMetadata(frontmatter, sourcePath)` API validates `description`, `navigation`, `toc`, `sidebarOutline` and `outlineLabelPrefix`. `navigation` accepts `visible` (default), `hidden` (routable without sidebar), and `disabled` (excluded). Existing source manifest helpers remain compatible with their current permissive metadata model.

```mdx
---
label: Getting started
title: Get started with MoyaForge
description: Install and configure the documentation framework.
navigation: visible
toc:
  show: true
  collapsible: true
  defaultOpen: true
---

# Getting started

Use **Markdown**, tables, fenced code, and MDX components.
```

## Shared Vite compiler

Install the supported peer dependencies and use `createMoyaForgeMdxOptions` with `@mdx-js/rollup`:

```js
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { createMoyaForgeMdxOptions } from "@moyarich/moyaforge/mdx";

export default {
  plugins: [
    { enforce: "pre", ...mdx(createMoyaForgeMdxOptions()) },
    react({ include: /\\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
  ],
};
```

The shared compiler enables GitHub-flavored Markdown, frontmatter exports, heading slugs and table-of-contents extraction. Add consumer-specific plugins (such as search indexing) locally. Pass the compiled pages to `createMoyaForgeSource` for URL normalization, navigation and search metadata.

The shared MDX components registry supports consumer overrides through `createMdxComponents`; Console keeps ownership of Console-specific components and content.
