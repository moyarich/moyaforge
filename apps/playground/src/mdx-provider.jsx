import {
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Code,
  ExternalLink,
  FileText,
  Info,
  Search as SearchIcon,
  Settings,
  Terminal as TerminalIcon,
} from "lucide-react";
import { MDXProvider } from "@mdx-js/react";
import {
  createMdxComponents,
  moyaForgeComponents,
} from "@moyarich/moyaforge/mdx";
import { PlaygroundCallout } from "./components/index.js";

const components = createMdxComponents(moyaForgeComponents, {
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Code,
  ExternalLink,
  FileText,
  Info,
  SearchIcon,
  Settings,
  TerminalIcon,
  Callout: PlaygroundCallout,
});

export function PlaygroundMdxProvider({ children }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
