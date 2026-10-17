import { readFile } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import {
  defaultDirectory,
  readOptional,
  within,
  safeDestination,
} from "./registry.js";

export const runtime = [
  "react@^19.0.0",
  "react-dom@^19.0.0",
  "react-router-dom@^7.18.4",
  "@mdx-js/react@^3.1.1",
  "@moyarich/moyaforge-mdx@^0.2.0",
  "lucide-react@^1.56.0",
];
export const development = [
  "vite@^8.3.4",
  "@vitejs/plugin-react@^6.1.2",
  "@mdx-js/rollup@^3.1.1",
  "@shikijs/rehype@^4.0.0",
  "typescript@^7.0.2",
  "@types/react@^19.0.0",
  "@types/react-dom@^19.0.0",
  "@types/node@^26.0.0",
];
const local = (appRoot, target) => {
  const path = relative(resolve(appRoot, "src"), target).replaceAll("\\", "/");
  return path.startsWith(".") ? path : `./${path}`;
};
export async function planProject({
  root,
  mode = "source",
  template = "docs",
  search = false,
  directory = defaultDirectory,
  registry,
}) {
  if (!["source", "package"].includes(mode))
    throw Error("--mode must be source or package");
  if (!["docs", "hybrid", "existing"].includes(template))
    throw Error("--template must be docs, hybrid, or existing");
  const appDirectory = template === "existing" ? "moyaforge" : ".";
  const appRoot = within(root, appDirectory);
  const ui = local(appRoot, within(root, directory));
  const replacements = {
    __UI__: ui,
    __DOCS_IMPORT__: `${ui}/components/Routing/content-routing.js`,
    __SHELL_IMPORT__: `${ui}/docs-shell.js`,
    __STYLE__: `${ui}/docs-shell.css`,
    "/* __CODE_STYLE_IMPORT__ */": `import "${ui}/code-group.css";`,
    __CODE_IMPORT__: `${ui}/components/CodeBlock/CodeBlock.js`,
    __DOCS_BASE__: template === "existing" ? "../docs" : "docs",
  };
  const files = [];
  async function add(path, content) {
    const destination = await safeDestination(root, path);
    files.push({
      path: destination,
      content,
      previous: await readOptional(destination),
    });
  }
  for (const name of [
    "index.html",
    "vite.config.ts",
    "registry.config.ts",
    "tsconfig.json",
    "src/main.tsx",
    "src/App.tsx",
    "src/mdx.d.ts",
    "src/styles.css",
  ]) {
    let content = await readFile(
      new URL(`../templates/${name}`, import.meta.url),
      "utf8",
    );
    for (const [key, value] of Object.entries(replacements))
      content = content.replaceAll(key, value);
    if (name === "src/App.tsx") {
      content = content.replace(
        "/* __SHELL_IMPORTS__ */",
        `import { DocsShell } from "${ui}/docs-shell.js";`,
      );
      content = content.replace(
        "/* __CODE_IMPORTS__ */",
        `import { CodeBlock } from "${ui}/components/CodeBlock/CodeBlock.js";\nimport { CodeGroup, CodeTab } from "${ui}/components/CodeGroup/CodeGroup.js";`,
      );
      content = content
        .replace(
          "/* __SEARCH_IMPORT__ */",
          search
            ? 'import { searchPages } from "@moyarich/moyaforge-search-sqlite/client";'
            : "",
        )
        .replace("__SEARCH_PROP__", search ? "search={searchPages}" : "");
      content = content.replace(
        "/* __SEARCH_COMPONENT__ */",
        search ? `function SearchPanel() {
  const [results, setResults] = useState<string[]>([]);
  return <div><label>Search documentation<input aria-label="Search documentation" onChange={async event => setResults(await searchPages(event.currentTarget.value))} /></label>
    <div className="mf-results">{results.map((result, index) => {
      const page = routes.find(page => page.title === result || page.path === result);
      return <Link key={index} to={page?.path ?? "/docs"}>{result}</Link>;
    })}</div>
  </div>;
}` : "",
      );
      content = content.replace(
        "/* __SEARCH_UI__ */",
        search ? "<SearchPanel />" : "",
      );
      content = content.replace(
        "/* __HYBRID_NAV__ */",
        template === "hybrid"
          ? '<Link to="/playground">Interactive playground</Link>'
          : "",
      );
      content = content.replace(
        "/* __HYBRID_ROUTE__ */",
        template === "hybrid"
          ? '<Route path="/playground" element={<main><h1>Interactive playground</h1><button onClick={() => setCount(count + 1)}>Count: {count}</button><Link to="/docs">Read the docs</Link></main>} />'
          : "",
      );
    }
    if (name === "vite.config.ts")
      content = content
        .replace(
          "/* __SEARCH_IMPORT__ */",
          search
            ? 'import { sqliteSearchPlugin } from "@moyarich/moyaforge-search-sqlite/vite";'
            : "",
        )
        .replace(
          "/* __SEARCH_PLUGIN__ */",
          search
            ? "sqliteSearchPlugin({ registry, root: import.meta.dirname }),"
            : "",
        );
    await add(resolve(appRoot, name), content);
  }
  await add(
    resolve(root, "docs/page.mdx"),
    `---\ntitle: Welcome\nlabel: Getting started\n---\n\n# Welcome\n\nYour documentation starts here. <BookOpen size={20} aria-hidden="true" />\n\n## Install\n\n\x60\x60\x60sh\nnpm install @moyarich/moyaforge\n\x60\x60\x60\n\n## Code tabs\n\n<CodeGroup><CodeTab label="npm"><pre>npm install example</pre></CodeTab><CodeTab label="pnpm"><pre>pnpm add example</pre></CodeTab></CodeGroup>\n`,
  );
  await add(
    resolve(root, "docs/guide/page.mdx"),
    "---\ntitle: Guide\n---\n\n# Guide\n\n[Welcome](../)\n\n## More details\n\nWrite Markdown or use React components.\n",
  );
  const packagePath = resolve(root, "package.json");
  const previous = await readOptional(packagePath);
  const manifest = previous
    ? JSON.parse(previous)
    : {
        name: "moyaforge-site",
        version: "0.0.0",
        private: true,
        type: "module",
      };
  const prefix = template === "existing" ? "docs:" : "";
  const config =
    template === "existing" ? " --config moyaforge/vite.config.ts" : "";
  manifest.scripts ??= {};
  for (const action of ["dev", "build", "preview"])
    manifest.scripts[`${prefix}${action}`] ??=
      `vite ${action === "dev" ? "" : action}${config}`.trim();
  manifest.scripts[`${prefix}typecheck`] ??=
    `tsc --noEmit -p ${template === "existing" ? "moyaforge/tsconfig.json" : "tsconfig.json"}`;
  const deps = [
    ...runtime,
    ...(mode === "package" ? ["@moyarich/moyaforge@^0.2.0"] : []),
    ...(search ? ["@moyarich/moyaforge-search-sqlite@^0.2.0"] : []),
  ];
  // Preserve host versions and scripts; install only missing dependencies.
  manifest.dependencies ??= {};
  manifest.devDependencies ??= {};
  for (const [list, key] of [
    [deps, "dependencies"],
    [development, "devDependencies"],
  ])
    for (const spec of list) {
      const at = spec.lastIndexOf("@");
      const name = spec.slice(0, at);
      const version = spec.slice(at + 1);
      if (!manifest.dependencies[name] && !manifest.devDependencies[name]) {
        const counterpart =
          name === "react-dom"
            ? "react"
            : name === "react"
              ? "react-dom"
              : null;
        manifest[key][name] = counterpart
          ? (manifest.dependencies[counterpart] ??
            manifest.devDependencies[counterpart] ??
            version)
          : version;
      }
    }
  await add(packagePath, JSON.stringify(manifest, null, 2) + "\n");
  files.at(-1).merge = true;
  await add(
    resolve(root, "moyaforge.components.json"),
    JSON.stringify(
      {
        registry:
          registry ??
          "https://raw.githubusercontent.com/moyarich/moyaforge/main/registry.json",
        directory,
      },
      null,
      2,
    ) + "\n",
  );
  return {
    files,
    dependencies: [...deps, ...development],
    manifestPath: packagePath,
  };
}
