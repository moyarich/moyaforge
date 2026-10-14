import { globSync } from "tinyglobby";
import { resolve, relative, sep } from "node:path";

export interface DiscoveredSourceFile {
  absolute: string;
  relative: string;
}

/** Shared source discovery for compatibility adapters that require a synchronous Vite load hook. */
export function discoverSourceFilesSync(
  base: string,
  include: readonly string[] = ["**/page.md", "**/page.mdx"],
  exclude: readonly string[] = [],
): DiscoveredSourceFile[] {
  const directory = resolve(base);
  return globSync([...include], {
    cwd: directory,
    ignore: [...exclude],
    absolute: true,
    onlyFiles: true,
  })
    .sort()
    .filter((file) => /(?:^|[\\/])page\.mdx?$/.test(file))
    .map((absolute) => ({
      absolute: absolute.split(sep).join("/"),
      relative: relative(directory, absolute).split(sep).join("/"),
    }));
}
