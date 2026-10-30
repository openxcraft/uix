import { describe, expect, it } from "vitest";
import { densePositions, midpoint, needsResequence } from "./positions";

describe("midpoint", () => {
  it("places first card in empty column", () => {
    expect(midpoint(undefined, undefined)).toBe(1000);
  });

  it("places before the first card", () => {
    expect(midpoint(undefined, 1000)).toBe(0);
  });

  it("places after the last card", () => {
    expect(midpoint(1000, undefined)).toBe(2000);
  });

  it("splits between neighbors", () => {
    expect(midpoint(1000, 2000)).toBe(1500);
  });

  it("keeps a positive sub-threshold midpoint between its neighbors", () => {
    const before = 1000;
    const after = before + 2e-7;
    const position = midpoint(before, after);

    expect(position).toBeGreaterThan(before);
    expect(position).toBeLessThan(after);
    expect(needsResequence([before, position, after])).toBe(true);
  });

  it("forces a gap on equal-position collisions", () => {
    expect(midpoint(1000, 1000)).toBeGreaterThan(1000);
    expect(midpoint(1000, 1000)).toBeLessThanOrEqual(1000.000001);
  });
});

describe("needsResequence", () => {
  it("accepts spread positions", () => {
    expect(needsResequence([0, 1000, 2000])).toBe(false);
  });

  it("rejects collapsed positions", () => {
    expect(needsResequence([0, 1e-7, 2000])).toBe(true);
  });
});

describe("densePositions", () => {
  it("produces the count requested with even spacing", () => {
    const positions = densePositions(3);
    expect(positions).toEqual([0, 1000, 2000]);
  });
});
