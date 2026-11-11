import { planItems } from "../registry.js";
import { planProject } from "../scaffold.js";
import { executePlan, resolveConsumer, type InstallOptions } from "../utils/install-plan.js";

export async function createProject(options: InstallOptions): Promise<void> {
  const { root, registry, directory } = await resolveConsumer(options);
  const project = await planProject({
    root, registry, directory, mode: options.mode, template: options.template, search: options.search,
  });
  const components = await planItems({ root, registry, directory, names: ["docs-shell", "code-group"] });
  await executePlan({
    files: [...components.files, ...project.files],
    dependencies: project.dependencies,
    instructions: components.instructions,
  }, options, root, "project");
}
