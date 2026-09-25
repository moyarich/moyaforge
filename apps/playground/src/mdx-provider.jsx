import { MDXProvider } from "@mdx-js/react";
import { Console, Terminal } from "@moyarich/console";
import * as ColorShower from "@moyarich/vscode-visualize-css-colors";

function Demo({ children }) {
  return <section data-demo>{children}</section>;
}

function PlaygroundCallout({ children }) {
  return <aside data-callout="playground">{children}</aside>;
}

const components = {
  Console,
  Terminal,
  ColorShower,
  Demo,
  Callout: PlaygroundCallout,
};

export function PlaygroundMdxProvider({ children }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
