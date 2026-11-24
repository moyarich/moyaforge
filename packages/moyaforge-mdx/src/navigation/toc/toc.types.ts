/** Heading IDs must originate from rehype-slug, never a second slug generator. */
export interface TocHeading {
  id: string;
  value: string;
  depth: number;
  children?: TocHeading[];
}
export interface ResolvedTocOptions {
  placement: "right" | "sidebar" | "inline" | "none";
  label: string;
  minDepth: number;
  maxDepth: number;
  collapsible: boolean;
  defaultOpen: boolean;
}
