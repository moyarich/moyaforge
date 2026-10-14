import { MDXProvider } from "@mdx-js/react";
import * as ColorShower from "@moyarich/colorshower";
import { createMdxComponents, moyaForgeComponents } from "@moyarich/moyaforge";
import { Demo, PlaygroundCallout } from "./components/index.js";

const components = createMdxComponents(moyaForgeComponents, {
  ColorShower,
  Demo,
  Callout: PlaygroundCallout,
});

export function PlaygroundMdxProvider({ children }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
