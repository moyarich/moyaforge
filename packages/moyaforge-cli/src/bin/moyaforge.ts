#!/usr/bin/env node
import { main } from "../cli.js";

/** Run the CLI and report failures using the command's standard exit code. */
main().catch((error: unknown) => {
  console.error(
    `moyaforge: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
