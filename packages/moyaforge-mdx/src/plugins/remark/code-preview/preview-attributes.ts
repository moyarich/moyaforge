export function readPreviewExampleAttribute(attributes: string) {
  return /(?:^|\s)example="([^"]+)"/.exec(attributes)?.[1];
}
