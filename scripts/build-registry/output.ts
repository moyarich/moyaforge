import { lstat, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function isMissing(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function firstMismatch(a: string, b: string) {
  const limit = Math.min(a.length, b.length);
  let index = 0;
  while (index < limit && a[index] === b[index]) index++;
  return index;
}

export interface RegistryOutputOptions {
  outputFile?: string;
  legacyStylesDir?: string | false;
}

export async function updateRegistryOutput(
  root: string,
  output: string,
  check: boolean,
  {
    outputFile = "registry.json",
    legacyStylesDir = "registry/styles",
  }: RegistryOutputOptions = {},
) {
  const manifestPath = resolve(root, outputFile);
  const existing = await readFile(manifestPath, "utf8").catch(
    (error: unknown) => {
      if (!check && isMissing(error)) return undefined;
      throw error;
    },
  );
  if (check && existing !== output) {
    const at = firstMismatch(existing ?? "", output);
    throw Error(
      `Registry is stale at character ${at}: expected ${JSON.stringify(output.slice(at, at + 100))}, found ${JSON.stringify(existing?.slice(at, at + 100))}. Run npm run registry:build.`,
    );
  }

  const stylesRoot = legacyStylesDir
    ? resolve(root, legacyStylesDir)
    : undefined;
  const hasLegacyStyles = stylesRoot
    ? await lstat(stylesRoot).then(
        () => true,
        (error: unknown) => {
          if (isMissing(error)) return false;
          throw error;
        },
      )
    : false;
  if (check && hasLegacyStyles)
    throw Error(
      "Obsolete registry/styles output exists. Run npm run registry:build.",
    );
  if (check) return;

  if (existing !== output) {
    await mkdir(dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, output);
  }
  if (stylesRoot && hasLegacyStyles)
    await rm(stylesRoot, { recursive: true, force: true });
}
