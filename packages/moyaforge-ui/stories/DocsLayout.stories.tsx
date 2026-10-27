import type { Meta, StoryObj } from "@storybook/react-vite";
import { DocsLayout, type DocsLayoutProps } from "../src/components/Layout/DocsLayout/DocsLayout.js";

const headings = [
  { id: "installation", text: "Installation", depth: 2 },
  { id: "configuration", text: "Configuration", depth: 2 },
  { id: "options", text: "Options", depth: 3 },
];
const pages = [
  { url: "/docs", title: "Introduction" },
  { url: "/docs/guide", title: "Guide" },
  { url: "/docs/api", title: "API" },
];
const meta = {
  title: "Layout/DocsLayout",
  component: DocsLayout,
  args: {
    pages,
    currentUrl: "/docs/guide",
    title: "MoyaForge UI",
    toc: { headings, placement: "right", collapsible: false },
  },
  render: (args: DocsLayoutProps) => (
    <DocsLayout {...args}>
      <article>
        <h1>Documentation guide</h1>
        <p>Use the sidebar and outline to navigate this sample documentation page.</p>
        <h2 id="installation">Installation</h2>
        <p>Install the source components in your application.</p>
        <h2 id="configuration">Configuration</h2>
        <p>Configure the navigation and layout.</p>
        <h3 id="options">Options</h3>
        <p>Customize the page slots and outline placement.</p>
      </article>
    </DocsLayout>
  ),
} satisfies Meta<typeof DocsLayout>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RightOutline: Story = {};
export const SidebarOutline: Story = { args: { toc: { headings, placement: "sidebar", collapsible: true } } };
export const InlineOutline: Story = { args: { toc: { headings, placement: "inline" } } };
export const NoOutline: Story = { args: { toc: false } };
export const CustomOutline: Story = {
  args: { outline: <aside aria-label="Custom outline"><a href="#installation">Jump to installation</a></aside> },
};
export const CustomSidebar: Story = {
  args: { sidebar: <aside><nav aria-label="Custom navigation"><a href="/docs">Introduction</a></nav></aside> },
};
