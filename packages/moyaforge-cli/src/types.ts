/** A source write with the snapshot used to detect concurrent edits. */
export interface PlannedFile {
  path: string;
  content: string;
  previous?: string;
  /** Permit a generated merge while preserving unrelated manifest fields. */
  merge?: boolean;
}

/** A reviewable installation plan; creating a plan performs no writes. */
export interface InstallPlan {
  files: PlannedFile[];
  dependencies: string[];
  instructions?: string[];
}

/** File metadata accepted from a shadcn-compatible component registry. */
export interface RegistryFile {
  path: string;
  target?: string;
  content?: string;
}

/** A component and the source files and dependencies required to install it. */
export interface RegistryItem {
  name: string;
  title?: string;
  description?: string;
  docs?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
}

/** Registry metadata used by listing and installation. */
export interface Registry {
  items: RegistryItem[];
}

/** Consumer manifest fields modified by scaffolding; other fields are retained. */
export interface PackageManifest {
  name?: string;
  version?: string;
  private?: boolean;
  type?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [field: string]: unknown;
}
