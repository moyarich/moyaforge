import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "../src/components/Search/Search.js";

const meta = {
  title: "Search/Search",
  component: Search,
  args: { inputProps: { placeholder: "Search documentation", "aria-label": "Search documentation" } },
} satisfies Meta<typeof Search>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const WithIcon: Story = {
  args: { icon: <span aria-hidden="true">⌕</span> },
};
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState("");
    return (
      <div style={{ padding: 24 }}>
        <Search {...args} value={value} onChange={(event) => setValue(event.target.value)} />
        <p>Query: {value || "none"}</p>
      </div>
    );
  },
};
