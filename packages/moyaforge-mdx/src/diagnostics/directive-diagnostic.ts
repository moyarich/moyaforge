import { createDiagnostic, MdxDiagnosticError } from "./create-diagnostic.js";
import type { DiagnosticContext } from "./types.js";

type DirectiveDiagnosticOptions = Pick<DiagnosticContext, "code" | "phase" | "attribute" | "expected" | "suggestion" | "related">;

/** Locate a directive or attribute in the original page, not its normalized AST. */
export function directiveDiagnostic(
  error: unknown,
  source: string,
  filename: string,
  offset: number | undefined,
  directive: string | undefined,
  options: DirectiveDiagnosticOptions,
): MdxDiagnosticError {
  if (error instanceof MdxDiagnosticError) return error;
  const before = offset === undefined ? undefined : source.slice(0, offset);
  const line = before === undefined ? undefined : before.split(/\r\n|\n|\r/).length;
  let column = before === undefined ? undefined : before.length - Math.max(before.lastIndexOf("\n"), before.lastIndexOf("\r"));
  if (offset !== undefined && column !== undefined && options.attribute) {
    const header = source.slice(offset).split(/\r\n|\n|\r/, 1)[0];
    const attribute = header.search(new RegExp("(?:^|\\s|\\{)" + options.attribute.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&") + "(?=\\s|=|\\}|$)"));
    if (attribute >= 0) column += attribute + 1;
  }
  return new MdxDiagnosticError(createDiagnostic(error, {
    ...options, source, directive,
    location: { file: filename, line, column },
  }), error);
}
