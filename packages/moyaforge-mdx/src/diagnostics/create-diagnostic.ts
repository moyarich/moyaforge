import type { Diagnostic, DiagnosticContext } from "./types.js";
import { createCodeFrame } from "./code-frame.js";
import { formatTerminalDiagnostic } from "./formatters/terminal.js";

type ErrorDetails = {
  message?: string;
  reason?: string;
  line?: number;
  column?: number;
  ruleId?: string;
  source?: string;
  place?: { end?: { line?: number; column?: number } };
};

/**
 * Normalize an exception into a structured MDX diagnostic.
 * Preserves existing MdxDiagnosticError diagnostics; otherwise merges location and plugin details with context.
 * @param error - Original exception or arbitrary thrown value.
 * @param context - Diagnostic code, phase, source location and optional authored text.
 * @returns Structured diagnostic, including a code frame when source and line are available.
 */
export function createDiagnostic(error: unknown, context: DiagnosticContext): Diagnostic {
  if (error instanceof MdxDiagnosticError) return error.diagnostic;
  const details = (typeof error === "object" && error !== null ? error : {}) as ErrorDetails;
  const { source, location, severity = "error", ...metadata } = context;
  const line = location.line ?? details.line;
  const column = location.column ?? details.column;
  return {
    ...metadata,
    severity,
    message: details.reason ?? details.message ?? String(error),
    plugin: context.plugin ?? details.source,
    location: {
      ...location, line, column,
      endLine: location.endLine ?? details.place?.end?.line,
      endColumn: location.endColumn ?? details.place?.end?.column,
    },
    frame: source !== undefined && line !== undefined ? createCodeFrame(source, line, column) : undefined,
  };
}

/** Keep the original exception available without serializing its stack or cause. */
export class MdxDiagnosticError extends Error {
  constructor(public readonly diagnostic: Diagnostic, cause?: unknown) {
    super(formatTerminalDiagnostic(diagnostic), { cause });
    this.name = "MdxDiagnosticError";
  }
}
