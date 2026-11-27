import type { Diagnostic } from "../types.js";

export function formatJsonDiagnostics(diagnostics: readonly Diagnostic[]): string {
  return JSON.stringify(diagnostics, null, 2);
}
