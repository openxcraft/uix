import { describe, expect, it } from "vitest";
import { assertBoardQuota, assertRuleRuns, FREE_PLAN, QuotaError } from "./quotas";

describe("board quota", () => {
  it("allows boards below the limit", () => {
    expect(() => assertBoardQuota(9, FREE_PLAN)).not.toThrow();
  });

  it("blocks boards at the limit", () => {
    expect(() => assertBoardQuota(10, FREE_PLAN)).toThrow(QuotaError);
    try {
      assertBoardQuota(10, FREE_PLAN);
    } catch (e) {
      expect((e as QuotaError).limit).toBe(10);
    }
  });
});

describe("rule run quota", () => {
  it("allows runs below the limit", () => {
    expect(assertRuleRuns(249, FREE_PLAN)).toBe(true);
  });

  it("blocks runs at the limit", () => {
    expect(assertRuleRuns(250, FREE_PLAN)).toBe(false);
  });
});
