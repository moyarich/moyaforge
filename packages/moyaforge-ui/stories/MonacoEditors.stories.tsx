import type { Meta, StoryObj } from "@storybook/react-vite";
import { initializeSharedMonaco } from "@moyarich/moyaforge-monaco/runtime/initializeSharedMonaco";
import { MonacoEditorWorkspace } from "../src/components/MonacoEditorWorkspace/index.js";
import { TypeFoxEditorWorkspace } from "../src/components/TypeFoxEditorWorkspace/index.js";

const reactFiles = [
  {
    name: "App.tsx",
    language: "typescript",
    value: 'import React from "react";\nexport function App() {\n  return <h1>Hello Monaco</h1>;\n}',
  },
  {
    name: "styles.css",
    language: "css",
    value: "h1 { color: rebeccapurple; }",
  },
];

const typefoxFiles = [
  {
    name: "Greeting.tsx",
    language: "typescript",
    value: 'import React from "react";\nexport const Greeting = () => <p>Hello TypeFox</p>;',
  },
  {
    name: "settings.json",
    language: "json",
    value: '{ "editor.tabSize": 2 }',
  },
];

const meta = {
  title: "Editors/Monaco",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Both implementations use one application-level VS Code-compatible Monaco runtime. " +
          "The shared Storybook loader awaits initialization before rendering either editor. " +
          "Do not call either standalone worker initializer.",
      },
    },
  },
  // Applies to every story in this file. Storybook waits for loaders before
  // mounting the story, and the shared initializer caches its promise.
  loaders: [
    async () => {
      await initializeSharedMonaco();
      return {};
    },
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReactMonaco: Story = {
  render: () => (
    <div style={{ maxWidth: 880 }}>
      <MonacoEditorWorkspace files={reactFiles} height={340} />
    </div>
  ),
};

export const TypeFoxMonaco: Story = {
  render: () => (
    <div style={{ maxWidth: 880 }}>
      <TypeFoxEditorWorkspace files={typefoxFiles} height={340} />
    </div>
  ),
};

export const SideBySide: Story = {
  name: "React + TypeFox (shared workers)",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
        gap: 20,
      }}
    >
      <section aria-label="React Monaco editor">
        <h3>React Monaco</h3>
        <MonacoEditorWorkspace files={reactFiles} height={340} />
      </section>
      <section aria-label="TypeFox Monaco editor">
        <h3>TypeFox</h3>
        <TypeFoxEditorWorkspace files={typefoxFiles} height={340} />
      </section>
    </div>
  ),
};
