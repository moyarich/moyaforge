/** Compute an entry’s nonnegative delay in seconds for either scheduling mode. */
export function getAnimationDelay(
  index: number,
  sequence = false,
  wait = 0,
  stagger = 0,
) {
  const gap = Math.max(0, stagger);
  if (sequence && index > 0) return gap;
  return Math.max(0, wait) + index * gap;
}
