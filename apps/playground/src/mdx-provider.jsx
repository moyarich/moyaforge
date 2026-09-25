import { MDXProvider } from "@mdx-js/react";
import {
  createMdxComponents,
  moyaForgeComponents,
} from "@moyarich/moyaforge";

function Demo({ children }) {
  return <section data-demo>{children}</section>;
}

function PlaygroundCallout({ children }) {
  return <aside data-callout="playground">{children}</aside>;
}

const components = createMdxComponents(moyaForgeComponents, {
  Demo,
  Callout: PlaygroundCallout,
});

export function PlaygroundMdxProvider({ children }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
