import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavigationTree } from "../src/components/NavigationTree/NavigationTree.js";

const page = (id: string, label: string) => ({
  id, label, path: "/docs/" + id, navPath: [label], frontmatter: {}, hidden: false,
});
const items = [
  { label: "Introduction", page: page("intro", "Introduction"), children: [] },
  { label: "Guides", children: [
    { label: "Installation", page: page("install", "Installation"), children: [] },
    { label: "Configuration", page: page("configure", "Configuration"), children: [] },
  ] },
];
const meta = {
  title: "Navigation/NavigationTree",
  component: NavigationTree,
  args: { items },
} satisfies Meta<typeof NavigationTree>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NestedNavigation: Story = {};
export const LinkedNavigation: Story = {
  args: { renderLink: (page) => <a href={page.path}>{page.label}</a> },
};
