const MIN_GAP = 1e-6;

export function midpoint(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return 1000;
  if (before === undefined) return after! - 1000;
  if (after === undefined) return before + 1000;
  if (after - before < MIN_GAP) return before + MIN_GAP / 2;
  return (before + after) / 2;
}

export function needsResequence(positions: number[]): boolean {
  const sorted = [...positions].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]! - sorted[i - 1]! < MIN_GAP) return true;
  }
  return false;
}

export function densePositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i * 1000);
}
