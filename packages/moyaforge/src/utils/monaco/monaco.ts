import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";

export type MoyaForgeMonacoExtension = NonNullable<MonacoVscodeApiConfig["extensions"]>[number];

export interface CreateMonacoVscodeConfigOptions {
  extensions?: readonly MoyaForgeMonacoExtension[];
  serviceOverrides?: MonacoVscodeApiConfig["serviceOverrides"];
  userConfiguration?: MonacoVscodeApiConfig["userConfiguration"];
  monacoWorkerFactory?: MonacoVscodeApiConfig["monacoWorkerFactory"];
}

export function createMonacoVscodeConfig({
  extensions = [],
  serviceOverrides = {},
  userConfiguration,
  monacoWorkerFactory,
}: CreateMonacoVscodeConfigOptions = {}): MonacoVscodeApiConfig {
  return {
    $type: "classic",
    viewsConfig: { $type: "EditorService" },
    serviceOverrides,
    userConfiguration,
    extensions: [...extensions],
    monacoWorkerFactory,
  };
}
