# @moyarich/moyaforge-ui

React components and styles for documentation sites and interactive examples. Use the package in your React application or install editable component source with the MoyaForge CLI.

[Browse live examples](https://moyarich.github.io/moyaforge/) · [Component documentation](https://github.com/moyarich/moyaforge/blob/main/packages/moyaforge-ui/docs/page.mdx)

## Install the package

```sh
npm install @moyarich/moyaforge-ui
```

Import individual components and their styles using the package's component entry points. React 18 or newer is required. Editor and routing components may require additional peer dependencies.

## Install editable components

```sh
npx @moyarich/moyaforge-cli@latest init
npx @moyarich/moyaforge-cli@latest add code-block
```

The CLI copies component source, required styles and shared files into your project. Customize the installed files to suit your application. Existing modifications are preserved unless you pass `--overwrite`.

See the [CLI guide](https://github.com/moyarich/moyaforge/tree/main/packages/moyaforge-cli) for installation options and the component documentation for examples.
