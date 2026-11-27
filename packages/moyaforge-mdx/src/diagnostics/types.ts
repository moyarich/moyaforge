export type DiagnosticSeverity = "error" | "warning";
export type DiagnosticPhase = "discovery" | "frontmatter" | "parse" | "directive" | "resolve" | "compile" | "vite";

export interface SourceLocation {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  phase: DiagnosticPhase;
  message: string;
  location: SourceLocation;
  plugin?: string;
  directive?: string;
  attribute?: string;
  expected?: string;
  suggestion?: string;
  related?: SourceLocation[];
  frame?: string;
}

export type DiagnosticContext = Omit<Diagnostic, "message" | "severity" | "frame"> & {
  source?: string;
  severity?: DiagnosticSeverity;
};
