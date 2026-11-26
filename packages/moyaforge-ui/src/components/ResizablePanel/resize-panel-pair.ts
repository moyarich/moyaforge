/** Keep the pair's total size and honor the limits of both neighboring panels. */
export function resizePanelPair({
  first,
  second,
  firstMin,
  firstMax,
  secondMin,
  secondMax,
  proposed,
}: {
  first: number;
  second: number;
  firstMin: number;
  firstMax: number;
  secondMin: number;
  secondMax: number;
  proposed: number;
}): [number, number] | null {
  const total = first + second;
  const minimum = Math.max(firstMin, total - secondMax);
  const maximum = Math.min(firstMax, total - secondMin);
  if (minimum > maximum) return null;
  const next = Math.max(minimum, Math.min(maximum, proposed));
  return [next, total - next];
}
