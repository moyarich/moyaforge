import {
  CopyButton,
  Demo,
  NavigationTree,
  Page,
  Source,
  TableOfContents,
} from "./components.js";

export const moyaForgeComponents = Object.freeze({
  CopyButton,
  Demo,
  NavigationTree,
  Page,
  Source,
  TableOfContents,
});

export function createMdxComponents(defaults = moyaForgeComponents, overrides = {}) {
  return {
    ...defaults,
    ...overrides,
  };
}
