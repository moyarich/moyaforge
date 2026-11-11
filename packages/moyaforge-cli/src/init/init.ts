import { planConfiguration } from "../scaffold.js";
import { executePlan, resolveConsumer, type InstallOptions } from "../cli/install.js";
import { createProject } from "../create/create.js";

export async function initializeProject(options: InstallOptions): Promise<void> {
  if (options.template !== undefined || options.mode !== undefined || options.search) {
    await createProject(options);
    return;
  }
  const { root, registry, directory } = await resolveConsumer(options);
  await executePlan(await planConfiguration({ root, registry, directory }), options, root, "configuration");
}
