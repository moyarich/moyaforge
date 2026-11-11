declare module "virtual:moyaforge-mdx/metadata" {
  export const routes: import("@moyarich/moyaforge-mdx").NormalizedPage[];
}
declare module "virtual:moyaforge-mdx/lazy-registry" {
  export const sources: Record<string, { lazyPages: Record<string, () => Promise<{default: import("react").ComponentType}>> }>;
}
