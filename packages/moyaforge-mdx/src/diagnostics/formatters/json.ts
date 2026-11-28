import type { Diagnostic } from "../types.js";

/**
 * Serialize diagnostics for machine-readable reporting.
 * @param diagnostics - Structured diagnostics in reporting order.
 * @returns JSON array formatted with two-space indentation.
 */
export function formatJsonDiagnostics(diagnostics: readonly Diagnostic[]): string {
  return JSON.stringify(diagnostics, null, 2);
}
