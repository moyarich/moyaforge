/** Shared worker initialization must take precedence over standalone Monaco. */
let shared = false;

export function isSharedMonacoRuntime() {
  return shared;
}

export function markSharedMonacoRuntime() {
  shared = true;
}
