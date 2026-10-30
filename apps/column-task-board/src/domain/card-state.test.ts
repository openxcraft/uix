import { describe, expect, it } from "vitest";
import { cardPhase, checklistProgress, isOverdue } from "./card-state";
import type { Card, ChecklistItem } from "./types";

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: "c1",
    boardId: "b1",
    columnId: "col1",
    title: "Card",
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

function item(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: "i1",
    checklistId: "cl1",
    text: "Item",
    done: false,
    assigneeId: null,
    dueAt: null,
    ...overrides,
  };
}

describe("cardPhase", () => {
  it("walks the card state machine", () => {
    expect(cardPhase(card())).toBe("active");
    expect(cardPhase(card({ completed: true }))).toBe("complete");
    expect(cardPhase(card({ archived: true }))).toBe("archived");
    expect(cardPhase(card({ archived: true, completed: true }))).toBe("archived");
    expect(cardPhase(card({ deletedAt: "2026-01-02T00:00:00.000Z" }))).toBe("deleted");
  });
});

describe("isOverdue", () => {
  it("marks past due uncompleted cards", () => {
    expect(
      isOverdue(card({ dueAt: "2026-01-01T00:00:00.000Z" }), new Date("2026-01-02T00:00:00.000Z")),
    ).toBe(true);
  });

  it("does not mark completed cards", () => {
    expect(
      isOverdue(
        card({ dueAt: "2026-01-01T00:00:00.000Z", completed: true }),
        new Date("2026-01-02T00:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("does not mark future cards", () => {
    expect(
      isOverdue(card({ dueAt: "2026-01-03T00:00:00.000Z" }), new Date("2026-01-02T00:00:00.000Z")),
    ).toBe(false);
  });
});

describe("checklistProgress", () => {
  it("computes percent from items", () => {
    expect(checklistProgress([])).toBe(0);
    expect(checklistProgress([item(), item({ done: true })])).toBe(50);
    expect(checklistProgress([item({ done: true }), item({ id: "i2", done: true })])).toBe(100);
  });
});
