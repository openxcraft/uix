import { describe, expect, it } from "vitest";
import { applyAction, isValidActions, matchesFilter, ruleMatches } from "./rules";
import type { Card, Rule } from "./types";

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: "c1",
    boardId: "b1",
    columnId: "col1",
    title: "Write release notes",
    description: "",
    position: 0,
    labelIds: [],
    memberIds: [],
    dueAt: null,
    completed: false,
    archived: false,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function rule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "r1",
    boardId: "b1",
    trigger: { type: "card-moved-to-column", columnId: "done" },
    actions: [{ type: "mark-complete" }],
    enabled: true,
    ...overrides,
  };
}

describe("ruleMatches", () => {
  it("matches column triggers", () => {
    expect(
      ruleMatches(rule(), { type: "card-moved-to-column", cardId: "c1", columnId: "done" }),
    ).toBe(true);
    expect(
      ruleMatches(rule(), { type: "card-moved-to-column", cardId: "c1", columnId: "todo" }),
    ).toBe(false);
  });

  it("ignores disabled rules", () => {
    expect(
      ruleMatches(rule({ enabled: false }), {
        type: "card-moved-to-column",
        cardId: "c1",
        columnId: "done",
      }),
    ).toBe(false);
  });

  it("matches label triggers", () => {
    const labelRule = rule({ trigger: { type: "label-added", labelId: "l1" } });
    expect(labelRule.actions).toBeDefined();
    expect(ruleMatches(labelRule, { type: "label-added", cardId: "c1", labelId: "l1" })).toBe(true);
    expect(ruleMatches(labelRule, { type: "label-added", cardId: "c1", labelId: "l2" })).toBe(
      false,
    );
  });
});

describe("applyAction", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("moves, completes, archives, and clears due", () => {
    expect(applyAction(card(), { type: "move-card", columnId: "col2" }, now).columnId).toBe("col2");
    expect(applyAction(card(), { type: "mark-complete" }, now).completed).toBe(true);
    expect(applyAction(card(), { type: "archive-card" }, now).archived).toBe(true);
    expect(applyAction(card({ dueAt: "x" }), { type: "clear-due" }, now).dueAt).toBeNull();
  });

  it("sets due in days", () => {
    expect(applyAction(card(), { type: "set-due", days: 2 }, now).dueAt).toBe(
      "2026-01-03T00:00:00.000Z",
    );
  });

  it("toggles label membership without duplicates", () => {
    const withLabel = applyAction(card(), { type: "add-label", labelId: "l1" }, now);
    expect(withLabel.labelIds).toEqual(["l1"]);
    expect(applyAction(withLabel, { type: "add-label", labelId: "l1" }, now).labelIds).toEqual([
      "l1",
    ]);
    expect(applyAction(withLabel, { type: "remove-label", labelId: "l1" }, now).labelIds).toEqual(
      [],
    );
  });
});

describe("isValidActions", () => {
  it("requires one to three actions", () => {
    expect(isValidActions([])).toBe(false);
    expect(isValidActions([{ type: "mark-complete" }])).toBe(true);
    expect(
      isValidActions([{ type: "mark-complete" }, { type: "archive-card" }, { type: "clear-due" }]),
    ).toBe(true);
    expect(
      isValidActions([
        { type: "mark-complete" },
        { type: "archive-card" },
        { type: "clear-due" },
        { type: "move-card", columnId: "x" },
      ]),
    ).toBe(false);
  });
});

describe("matchesFilter", () => {
  const now = new Date("2026-01-05T00:00:00.000Z");

  it("filters by title query", () => {
    expect(matchesFilter(card({ title: "Release" }), { q: "rel" }, now)).toBe(true);
    expect(matchesFilter(card({ title: "Release" }), { q: "deploy" }, now)).toBe(false);
  });

  it("filters by label and member", () => {
    const c = card({ labelIds: ["l1"], memberIds: ["m1"] });
    expect(matchesFilter(c, { labelIds: ["l1"] }, now)).toBe(true);
    expect(matchesFilter(c, { labelIds: ["l2"] }, now)).toBe(false);
    expect(matchesFilter(c, { memberId: "m1" }, now)).toBe(true);
    expect(matchesFilter(c, { memberId: "m2" }, now)).toBe(false);
  });

  it("filters by due state", () => {
    const overdue = card({ dueAt: "2026-01-04T00:00:00.000Z" });
    const today = card({ dueAt: "2026-01-05T12:00:00.000Z" });
    const week = card({ dueAt: "2026-01-09T00:00:00.000Z" });
    const none = card();
    expect(matchesFilter(overdue, { due: "overdue" }, now)).toBe(true);
    expect(matchesFilter(today, { due: "today" }, now)).toBe(true);
    expect(matchesFilter(week, { due: "week" }, now)).toBe(true);
    expect(matchesFilter(none, { due: "none" }, now)).toBe(true);
    expect(matchesFilter(overdue, { due: "none" }, now)).toBe(false);
  });
});
