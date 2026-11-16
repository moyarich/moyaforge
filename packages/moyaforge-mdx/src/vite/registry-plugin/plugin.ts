import { resolve, sep } from "node:path";
import type { Plugin } from "vite";
import { discoverContent } from "../../content/discovery.js";
import type { RegistryPluginOptions } from "./options.js";
import {
  createMetadataModule,
  createPageModule,
  findRepositoryRoot,
  resolvedModuleIds,
  virtualModuleIds,
  virtualModules,
} from "./virtual-modules.js";
import { emitStaticPublication } from "./publication.js";

export type {
  RegistrySource,
  RegistryConfiguration,
  RegistryPluginOptions,
} from "./options.js";

/** Expose discovered MDX pages through Vite's virtual module convention. */
export function mdxRegistryPlugin({
  registry,
  root,
  repositoryRoot,
  discovery: sharedDiscovery,
  publication,
}: RegistryPluginOptions): Plugin {
  const appRoot = resolve(root);
  const editRoot = repositoryRoot
    ? resolve(appRoot, repositoryRoot)
    : findRepositoryRoot(appRoot);
  const directories = Object.values(registry.sources).map((source) =>
    resolve(appRoot, source.base),
  );

  // Cache one discovery across all virtual modules until a source file changes.
  let pending: ReturnType<typeof discoverContent> | undefined;
  const getContent = () =>
    sharedDiscovery
      ? sharedDiscovery.get()
      : (pending ??= discoverContent(registry, appRoot));
  const invalidateContent = () => {
    pending = undefined;
    sharedDiscovery?.invalidate();
  };

  return {
    name: "moyaforge-mdx:registry",
    enforce: "pre",

    resolveId: {
      filter: {
        id: /^virtual:moyaforge-mdx\/(?:registry|lazy-registry|metadata)$/,
      },
      handler(id) {
        return virtualModuleIds.includes(id) ? "\0" + id : undefined;
      },
    },

    load: {
      filter: {
        id: /^\0virtual:moyaforge-mdx\/(?:registry|lazy-registry|metadata)$/,
      },
      async handler(id) {
        const content = await getContent();

        switch (id) {
          case "\0" + virtualModules.registry:
            return createPageModule(content, registry, appRoot, false);
          case "\0" + virtualModules.lazyRegistry:
            return createPageModule(content, registry, appRoot, true);
          case "\0" + virtualModules.metadata:
            return createMetadataModule(content, registry, appRoot, editRoot);
        }
      },
    },

    async generateBundle() {
      if (!publication) return;
      await emitStaticPublication(
        (asset) => this.emitFile(asset),
        await getContent(),
        registry,
        appRoot,
        publication,
      );
    },

    configureServer(server) {
      server.watcher.add(directories);

      const onSourceChange = (file: string) => {
        const changed = resolve(file);
        const inSourceDirectory = directories.some(
          (directory) =>
            changed === directory || changed.startsWith(directory + sep),
        );
        if (!inSourceDirectory) return;

        invalidateContent();
        for (const id of resolvedModuleIds) {
          const module = server.moduleGraph.getModuleById(id);
          if (module) server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: "full-reload" });
      };

      server.watcher.on("add", onSourceChange);
      server.watcher.on("change", onSourceChange);
      server.watcher.on("unlink", onSourceChange);
    },
  };
}
