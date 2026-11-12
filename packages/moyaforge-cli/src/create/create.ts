import { planComponentInstallation } from "../registry.js";
import { planProject } from "../scaffold.js";
import { executePlan, resolveConsumer, type InstallOptions } from "../utils/install-plan.js";

export async function createProject(options: InstallOptions): Promise<void> {
  const { root, registry, directory } = await resolveConsumer(options);
  const project = await planProject({
    root, registry, directory, mode: options.mode, template: options.template, search: options.search,
  });
  const components = await planComponentInstallation({ root, registry, directory, names: options.template === "playground"
      ? ["documentation-site", "sidebar-v1", "doc-outline", "custom-block", "code-group", ...(options.search ? ["search"] : [])]
      : ["docs-shell", "code-group", ...(options.search ? ["search"] : [])] });
  await executePlan({
    files: [...components.files, ...project.files],
    dependencies: project.dependencies,
    instructions: components.instructions,
  }, options, root, "project");
}
