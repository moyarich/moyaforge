import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";
import { monacoReactTypesPlugin } from "@moyarich/moyaforge-monaco/vite";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: { name: "@storybook/react-vite", options: {} },
  docs: {},
  async viteFinal(config) {
    config.plugins ??= [];
    config.plugins.push(monacoReactTypesPlugin(workspaceRoot));
    return config;
  },
};
export default config;
