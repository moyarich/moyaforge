import { planComponentInstallation } from "../registry/registry.js";
import { planProject } from "./scaffold.js";
import {
  executePlan,
  resolveConsumer,
  type InstallOptions,
} from "./install-plan.js";

export async function createProject(options: InstallOptions): Promise<void> {
  const { root, registry, directory } = await resolveConsumer(options);
  const components = await planComponentInstallation({
    root,
    registry,
    directory,
    names:
      options.template === "playground"
        ? [
            "documentation-site",
            "sidebar-v1",
            "doc-outline",
            "custom-block",
            "card",
            "code-block",
            "code-group",
            "preview-code",
            ...(options.search ? ["search"] : []),
          ]
        : ["docs-shell", "code-group", "card", ...(options.search ? ["search"] : [])],
  });
  const project = await planProject({
    root,
    registry,
    directory,
    mode: options.mode,
    template: options.template,
    search: options.search,
    componentDependencies: components.dependencies,
  });
  await executePlan(
    {
      files: [...components.files, ...project.files],
      dependencies: project.dependencies,
      instructions: components.instructions,
    },
    options,
    root,
    "project",
  );
}
