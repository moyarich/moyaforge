import type { Meta, StoryObj } from "@storybook/react-vite";
import { CodeGroup, CodeTab } from "../src/components/CodeGroup/CodeGroup.js";
import { CodeBlock } from "../src/components/CodeBlock/CodeBlock.js";

const meta = {
  title: "Code/CodeGroup",
  component: CodeGroup,
  args: { label: "Install commands" },
  render: (args) => (
    <div style={{ maxWidth: 720, padding: 24 }}>
      <CodeGroup {...args}>
        <CodeTab label="npm"><CodeBlock language="bash"><code>npm install example</code></CodeBlock></CodeTab>
        <CodeTab label="pnpm"><CodeBlock language="bash"><code>pnpm add example</code></CodeBlock></CodeTab>
        <CodeTab label="yarn"><CodeBlock language="bash"><code>yarn add example</code></CodeBlock></CodeTab>
      </CodeGroup>
    </div>
  ),
} satisfies Meta<typeof CodeGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PackageManagers: Story = {};
export const KeyboardNavigation: Story = {
  parameters: { docs: { description: { story: "Use Left/Right, Home and End to select a tab; copy uses the selected panel." } } },
};
