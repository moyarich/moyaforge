import { resolve, relative, sep } from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import { glob } from "tinyglobby";
import initSqlJs from "sql.js";
import { buildSearchDatabase } from "../dist/index.js";

const virtualId = "virtual:moyaforge-search/database";
const resolvedId = "\0" + virtualId;
const endpoint = "/__moyaforge_search.sqlite";

function clean(content) {
  return content
    .replace(/^---\s*\n[\s\S]*?\n---\s*/, " ")
    .replace(/\x60{3}[\s\S]*?\x60{3}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[{}#*\x60_\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function frontmatter(text, field) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return undefined;
  const found = match[1].match(new RegExp("^" + field + ":\\s*(.*)$", "m"));
  return found?.[1]?.trim().replace(/^['"]|['"]$/g, "");
}
function docsFor(registry, root) {
  return Promise.all(
    Object.entries(registry.sources).map(async ([sourceName, source]) => {
      const base = resolve(root, source.base);
      const entries = await glob([...source.include], {
        cwd: base,
        absolute: true,
        onlyFiles: true,
        ignore: source.exclude ? [...source.exclude] : [],
      });
      return Promise.all(
        entries
          .sort()
          .filter((file) =>
            /^page\.mdx?$/.test(
              file.replaceAll("\\", "/").split("/").at(-1) ?? "",
            ),
          )
          .map(async (file) => {
            const raw = await readFile(file, "utf8");
            // Disabled pages have no route and must not appear in search.
            if (frontmatter(raw, "navigation") === "disabled") return null;
            const name = relative(base, file).split(sep).join("/");
            const segments = name.split("/");
            const folder = segments.at(-2) ?? sourceName;
            const title =
              frontmatter(raw, "title") ??
              folder
                .replace(/^\d+[-_ ]/, "")
                .replace(/[-_]+/g, " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase());
            return {
              key: sourceName + "/" + name,
              title,
              description: frontmatter(raw, "description") ?? "",
              body: clean(raw),
            };
          }),
      );
    }),
  ).then((groups) => groups.flat().filter((document) => document !== null));
}

export function sqliteSearchPlugin({ registry, root }) {
  const roots = Object.values(registry.sources).map((source) =>
    resolve(root, source.base),
  );
  let mode = "serve",
    base = "/";
  let SQL,
    bytes,
    dirty = true,
    outputUrl;
  const build = async () => {
    if (!SQL)
      SQL = await initSqlJs({
        locateFile: (file) => require.resolve("sql.js/dist/" + file),
      });
    if (!dirty && bytes) return bytes;
    bytes = buildSearchDatabase(SQL, await docsFor(registry, root));
    dirty = false;
    return bytes;
  };
  const notify = (server, file) => {
    const absolute = resolve(file);
    if (!roots.some((root) => absolute.startsWith(root + sep))) return;
    if (!/\.(md|mdx)$/.test(absolute)) return;
    dirty = true;
    server.ws.send({ type: "custom", event: "moyaforge-search:updated" });
  };
  return {
    name: "moyaforge-search-sqlite:sqlite-search",
    configResolved(config) {
      mode = config.command;
      base = config.base;
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    async load(id) {
      if (id !== resolvedId) return;
      if (mode === "serve")
        return `export const databaseUrl = import.meta.env.BASE_URL + "${endpoint.slice(1)}";`;
      await build();
      const hash = createHash("sha256")
        .update(bytes)
        .digest("hex")
        .slice(0, 10);
      outputUrl = "assets/search-" + hash + ".sqlite";
      this.emitFile({ type: "asset", fileName: outputUrl, source: bytes });
      return `export const databaseUrl = import.meta.env.BASE_URL + "${outputUrl}";`;
    },
    configureServer(server) {
      server.watcher.add(roots);
      server.watcher.on("add", (file) => notify(server, file));
      server.watcher.on("change", (file) => notify(server, file));
      server.watcher.on("unlink", (file) => notify(server, file));
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split("?")[0] !== base + endpoint.slice(1)) return next();
        try {
          const data = await build();
          res.setHeader("Content-Type", "application/vnd.sqlite3");
          res.setHeader("Cache-Control", "no-store");
          res.end(Buffer.from(data));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
