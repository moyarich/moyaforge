import { useState } from "react";
import { useMDXComponents, MDXProvider } from "@mdx-js/react";
import { CustomBlock } from "../CustomBlock/index.js";
import {
  CodeGroup,
  CodeTab,
} from "../CodeGroup/index.js";

function AlternativeBlock({ type, title, children }) {
  return (
    <section
      className={`custom-block ${type ?? ""}`}
      data-type={type}
      style={{
        border: "2px dashed var(--mf-custom-block-border, currentColor)",
      }}
    >
      {title && (
        <header>
          <strong>{title}</strong>
        </header>
      )}
      {children}
    </section>
  );
}

function AlternativeCodeGroup({ label, children }) {
  return (
    <section aria-label={label}>
      <strong>{label}</strong>
      <div>{children}</div>
    </section>
  );
}

function AlternativeCodeTab({ label, children }) {
  return (
    <div>
      <strong>{label}</strong>
      {children}
    </div>
  );
}

function PreviewContent() {
  const {
    CustomBlock: Block,
    CodeGroup: Group,
    CodeTab: Tab,
  } = useMDXComponents();
  return (
    <>
      <Block type="experimental" title="Experimental Feature">
        <p>The same semantic content uses the selected renderer and theme.</p>
      </Block>
      <Group label="Package managers">
        <Tab label="npm">
          <pre>npm install example-package</pre>
        </Tab>
        <Tab label="pnpm">
          <pre>pnpm add example-package</pre>
        </Tab>
      </Group>
    </>
  );
}

export function RendererSwitcher({ renderers, themes, children }) {
  const [renderer, setRenderer] = useState("default");
  const [theme, setTheme] = useState("neutral");
  const defaults =
    renderer === "alternative"
      ? {
          CustomBlock: AlternativeBlock,
          CodeGroup: AlternativeCodeGroup,
          CodeTab: AlternativeCodeTab,
        }
      : { CustomBlock, CodeGroup, CodeTab };
  const overrides = renderers?.[renderer] ?? defaults;
  const defaultThemeStyle =
    theme === "violet"
      ? { "--mf-color-surface": "#f5f3ff", "--mf-color-border": "#7c3aed" }
      : { "--mf-color-surface": "#f3f4f6", "--mf-color-border": "#6b7280" };
  const themeStyle = themes?.[theme] ?? defaultThemeStyle;
  return (
    <div>
      <p>
        <label>
          Renderer{" "}
          <select
            aria-label="Renderer"
            value={renderer}
            onChange={(event) => setRenderer(event.target.value)}
          >
            <option value="default">MoyaForge</option>
            <option value="alternative">Alternative</option>
          </select>
        </label>{" "}
        <label>
          Theme{" "}
          <select
            aria-label="Theme"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
          >
            <option value="neutral">Neutral</option>
            <option value="violet">Violet</option>
          </select>
        </label>
      </p>
      <div
        style={themeStyle}
        data-preview-theme={theme}
        data-preview-renderer={renderer}
      >
        <MDXProvider components={overrides}>
          {children ?? <PreviewContent />}
        </MDXProvider>
      </div>
    </div>
  );
}
