import { planConfiguration } from "../scaffold.js";
import { executePlan, resolveConsumer, type InstallOptions } from "../utils/install-plan.js";
import { planComponentInstallation } from "../registry.js";
import { planProject } from "../scaffold.js";

export async function initializeProject(options: InstallOptions): Promise<void> {
  if (options.template !== undefined || options.mode !== undefined || options.search) {
    await scaffoldProject(options);
    return;
  }
  const { root, registry, directory } = await resolveConsumer(options);
  await executePlan(await planConfiguration({ root, registry, directory }), options, root, "configuration");
}

/** Generate an application using the same registry installer as `moyaforge add`. */
async function scaffoldProject(options: InstallOptions): Promise<void> {
  const { root, registry, directory } = await resolveConsumer(options);
  const project = await planProject({
    root, registry, directory, mode: options.mode, template: options.template,
    search: options.search,
  });
  const names = options.template === "playground"
    ? ["documentation-site", "sidebar-v1", "doc-outline", "custom-block", "code-block", "code-group", ...(options.search ? ["search"] : [])]
    : ["docs-shell", "code-group", ...(options.search ? ["search"] : [])];
  const components = await planComponentInstallation({ root, registry, directory, names });
  await executePlan({
    files: [...components.files, ...project.files],
    dependencies: project.dependencies,
    instructions: components.instructions,
  }, options, root, "project");
}
