import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compile } from "@mdx-js/mdx";
import { test } from "vitest";
import { createMdxOptions } from "../../dist/index.js";
import {
  createPreviewCodeRegistry,
  createPreviewCodePlugin,
  resolvePreviewCodeSource,
} from "../../dist/vite/plugin.js";

const sources = { docs: { base: "docs" } };
const pages = [{ source: "docs", file: "guide/page.mdx" }];

test("registered component roots resolve nested files and named exports without weakening docs scoping", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-preview-roots-"));
  try {
    const docs = join(root, "docs/guide");
    const components = join(root, "ui/components");
    await mkdir(docs, { recursive: true });
    await mkdir(join(components, "CodeBlock"), { recursive: true });
    await mkdir(join(components, "nested"), { recursive: true });
    await mkdir(join(root, "private"), { recursive: true });
    const page = join(docs, "page.mdx");
    const shared = join(components, "CodeBlock/CodeBlock.tsx");
    const hidden = join(root, "private/Hidden.tsx");
    await writeFile(page, "# Guide");
    await writeFile(join(docs, "Example.tsx"), "export default function Example() { return null; }");
    await writeFile(shared, "export function CodeBlock() { return null; }");
    await writeFile(join(components, "nested/Greeting.tsx"), "export default function Greeting() { return null; }");
    await writeFile(hidden, "export default function Hidden() { return null; }");
    await symlink(hidden, join(components, "Secret.tsx"));

    for (const resolutionScope of ["directory", "source", "global"]) {
      const context = createPreviewCodeRegistry({
        root,
        sources,
        pages,
        resolutionScope,
      });
      assert.deepEqual(context.componentRoots, [docs]);
      const plugin = createPreviewCodePlugin({
        codePreview: context,
        componentRoots: [...context.componentRoots, "ui/components"],
      });
      assert.equal(
        context.keysByPath.get(shared),
        "component-root-0/CodeBlock/CodeBlock.tsx",
      );
      assert.equal(context.basesByPath.get(shared), components);
      assert.equal(
        context.modules.get("component-root-0/CodeBlock/CodeBlock.tsx"),
        shared,
      );
      const resolveComponent = (reference) =>
        resolvePreviewCodeSource({ context, reference, authoredFile: page });

      assert.equal(
        resolveComponent("../../ui/components/CodeBlock/CodeBlock.tsx#CodeBlock"),
        "component-root-0/CodeBlock/CodeBlock.tsx#CodeBlock",
      );
      assert.equal(
        resolveComponent("../../ui/components/nested/Greeting.tsx"),
        "component-root-0/nested/Greeting.tsx",
      );
      assert.equal(resolveComponent("./Example.tsx"), "docs/guide/Example.tsx");
      assert.equal(resolveComponent("../../private/Hidden.tsx"), undefined);
      assert.equal(resolveComponent("../../ui/components/Secret.tsx"), undefined);
      assert.equal(resolveComponent("../../ui/components/CodeBlock/CodeBlock.tsx#Bad;Name"), undefined);

      const componentId = plugin.resolveId("virtual:moyaforge-mdx/preview-code-components");
      const code = await plugin.load.handler(componentId);
      assert.match(code, /component-root-0\/CodeBlock\/CodeBlock\.tsx/);
      assert.doesNotMatch(code, /Hidden\.tsx|Secret\.tsx/);

      const compiled = String(
        await compile(
          { path: page, value: '::::preview-code[Shared]{component="../../ui/components/CodeBlock/CodeBlock.tsx#CodeBlock"}\n\n::::' },
          createMdxOptions({
            componentMappings: {
              "preview-code": {
                component: "PreviewCodeInline",
                resolvePreviewCodeComponent: (reference, authoredFile) =>
                  resolvePreviewCodeSource({ context, reference, authoredFile }),
              },
            },
          }),
        ),
      );
      assert.match(compiled, /component-root-0\/CodeBlock\/CodeBlock\.tsx#CodeBlock/);
    }

    // Explicitly registering a documentation root keeps its pre-existing
    // sibling registry entries rather than replacing or deleting them.
    const overlapping = createPreviewCodeRegistry({
      root, sources, pages, resolutionScope: "directory",
    });
    createPreviewCodePlugin({
      codePreview: overlapping,
      componentRoots: [...overlapping.componentRoots, "docs"],
    });
    assert.equal(
      resolvePreviewCodeSource({
        context: overlapping, reference: "./Example.tsx", authoredFile: page,
      }),
      "docs/guide/Example.tsx",
    );
    assert.equal(overlapping.modules.get("docs/guide/Example.tsx"), join(docs, "Example.tsx"));

    const noRoots = createPreviewCodeRegistry({ root, sources, pages });
    assert.deepEqual(noRoots.componentRoots, [docs]);
    createPreviewCodePlugin({ codePreview: noRoots });
    assert.equal(noRoots.registeredComponents.size, 0);
    assert.equal(resolvePreviewCodeSource({
      context: noRoots,
      reference: "../../ui/components/CodeBlock/CodeBlock.tsx",
      authoredFile: page,
    }), undefined);
    assert.throws(
      () => createPreviewCodePlugin({ codePreview: noRoots, componentRoots: ["missing"] }),
      /Invalid preview-code component root/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("component root watcher updates virtual module entries after additions and removals", async () => {
  const root = await mkdtemp(join(tmpdir(), "moyaforge-preview-watch-"));
  try {
    await mkdir(join(root, "docs"), { recursive: true });
    await mkdir(join(root, "shared"), { recursive: true });
    const page = join(root, "docs/page.mdx");
    const added = join(root, "shared/Added.tsx");
    await writeFile(page, "# Docs");
    const context = createPreviewCodeRegistry({
      root,
      sources,
      pages: [{ source: "docs", file: "page.mdx" }],
    });
    const plugin = createPreviewCodePlugin({
      codePreview: context,
      componentRoots: [...context.componentRoots, "shared"],
    });
    const listeners = new Map();
    const invalidations = [];
    const messages = [];
    const watched = [];
    plugin.configureServer({
      watcher: {
        add(paths) { watched.push(...paths); },
        on(event, listener) { listeners.set(event, listener); },
      },
      moduleGraph: {
        getModuleById(id) { return { id }; },
        invalidateModule(module) { invalidations.push(module.id); },
      },
      ws: { send(message) { messages.push(message); } },
    });
    assert.deepEqual(watched, [join(root, "shared")]);

    const resolveAdded = () => resolvePreviewCodeSource({
      context, authoredFile: page, reference: "../shared/Added.tsx",
    });
    assert.equal(resolveAdded(), undefined);
    await writeFile(added, "export default () => null;");
    listeners.get("add")(added);
    assert.equal(resolveAdded(), "component-root-0/Added.tsx");

    const moduleId = plugin.resolveId("virtual:moyaforge-mdx/preview-code-components");
    assert.match(await plugin.load.handler(moduleId), /Added\.tsx/);
    await rm(added);
    listeners.get("unlink")(added);
    assert.equal(resolveAdded(), undefined);
    assert.doesNotMatch(await plugin.load.handler(moduleId), /Added\.tsx/);
    assert.equal(invalidations.length, 4);
    assert.deepEqual(messages, [{ type: "full-reload" }, { type: "full-reload" }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
