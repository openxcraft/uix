import { beforeEach, describe, expect, it } from "vitest";
import { getState, resetForTests, store } from "./store";
import { FREE_PLAN } from "../domain/quotas";
import type { LabelColorId } from "../domain/types";

beforeEach(() => {
  localStorage.clear();
  resetForTests();
});

describe("board management", () => {
  it("creates a board with three default columns", () => {
    const board = store.createBoard("First board", "workspace");
    const columns = getState().columns.filter((c) => c.boardId === board.id);
    expect(columns.map((c) => c.title)).toEqual(["To do", "Doing", "Done"]);
    expect(getState().activity[0]?.action).toBe("board-created");
  });

  it("enforces the board quota", () => {
    for (let i = 0; i < FREE_PLAN.maxBoards; i++) {
      store.createBoard(`Board ${i}`, "private");
    }
    expect(() => store.createBoard("Over limit", "private")).toThrow();
  });
});

describe("card operations", () => {
  it("creates and moves cards between columns", () => {
    const board = store.createBoard("Board", "workspace");
    const columns = getState().columns.filter((c) => c.boardId === board.id);
    const todo = columns[0]!;
    const done = columns[2]!;
    store.createCard(board.id, todo.id, "Task A");
    store.createCard(board.id, todo.id, "Task B");
    const cardA = getState().cards.find((c) => c.title === "Task A")!;

    store.moveCard(cardA.id, done.id, null);

    const moved = getState().cards.find((c) => c.id === cardA.id)!;
    expect(moved.columnId).toBe(done.id);
    expect(getState().activity[0]?.action).toBe("card-moved");
  });

  it("archives, restores, and deletes with activity records", () => {
    const board = store.createBoard("Board", "workspace");
    const column = getState().columns.filter((c) => c.boardId === board.id)[0]!;
    store.createCard(board.id, column.id, "Task");
    const card = getState().cards[0]!;

    store.archiveCard(card.id);
    expect(getState().cards.find((c) => c.id === card.id)?.archived).toBe(true);
    store.restoreCard(card.id);
    expect(getState().cards.find((c) => c.id === card.id)?.archived).toBe(false);
    store.deleteCard(card.id);
    expect(getState().cards.find((c) => c.id === card.id)?.deletedAt).not.toBeNull();
    const actions = getState().activity.map((a) => a.action);
    expect(actions).toContain("card-archived");
    expect(actions).toContain("card-restored");
    expect(actions).toContain("card-deleted");
  });
});

describe("automation rules", () => {
  it("completes a card moved into the trigger column", () => {
    const board = store.createBoard("Board", "workspace");
    const columns = getState().columns.filter((c) => c.boardId === board.id);
    const todo = columns[0]!;
    const done = columns[2]!;
    store.createRule(board.id, { type: "card-moved-to-column", columnId: done.id }, [
      { type: "mark-complete" },
      { type: "archive-card" },
    ]);
    store.createCard(board.id, todo.id, "Task");
    const card = getState().cards[0]!;

    store.moveCard(card.id, done.id, null);

    const moved = getState().cards.find((c) => c.id === card.id)!;
    expect(moved.completed).toBe(true);
    expect(moved.archived).toBe(true);
    expect(getState().activity[0]?.action).toBe("rule-executed");
    expect(getState().ruleRuns).toBe(1);
  });

  it("fires checklist-completed rules at full progress", () => {
    const board = store.createBoard("Board", "workspace");
    const column = getState().columns.filter((c) => c.boardId === board.id)[0]!;
    store.createRule(board.id, { type: "checklist-completed" }, [{ type: "mark-complete" }]);
    store.createCard(board.id, column.id, "Task");
    const card = getState().cards[0]!;
    store.addChecklist(card.id, "Steps");
    const checklist = getState().checklists[0]!;
    store.addChecklistItem(checklist.id, "One");
    store.addChecklistItem(checklist.id, "Two");
    const items = getState().checklistItems.filter((i) => i.checklistId === checklist.id);

    store.toggleChecklistItem(items[0]!.id);
    expect(getState().cards.find((c) => c.id === card.id)?.completed).toBe(false);
    store.toggleChecklistItem(items[1]!.id);
    expect(getState().cards.find((c) => c.id === card.id)?.completed).toBe(true);
  });

  it("fires label-added rules", () => {
    const board = store.createBoard("Board", "workspace");
    const column = getState().columns.filter((c) => c.boardId === board.id)[0]!;
    store.createCard(board.id, column.id, "Task");
    const card = getState().cards[0]!;
    const label = store.createLabel(board.id, "Urgent", "red" as LabelColorId);
    store.createRule(board.id, { type: "label-added", labelId: label.id }, [
      { type: "set-due", days: 3 },
    ]);

    store.toggleLabel(card.id, label.id);

    const updated = getState().cards.find((c) => c.id === card.id)!;
    expect(updated.dueAt).not.toBeNull();
  });

  it("fires due-date-reached rules once per due timestamp", () => {
    const board = store.createBoard("Board", "workspace");
    const column = getState().columns.filter((c) => c.boardId === board.id)[0]!;
    store.createCard(board.id, column.id, "Task");
    const card = getState().cards[0]!;
    store.setDue(card.id, "2026-01-01T00:00:00.000Z");
    store.createRule(board.id, { type: "due-date-reached" }, [{ type: "mark-complete" }]);

    store.fireDueEvents(new Date("2026-01-02T00:00:00.000Z"));
    expect(getState().cards.find((c) => c.id === card.id)?.completed).toBe(true);

    store.setCompleted(card.id, false);
    store.fireDueEvents(new Date("2026-01-02T00:00:00.000Z"));
    expect(getState().cards.find((c) => c.id === card.id)?.completed).toBe(false);
  });
});

describe("labels and members", () => {
  it("toggles labels without duplicates", () => {
    const board = store.createBoard("Board", "workspace");
    const column = getState().columns.filter((c) => c.boardId === board.id)[0]!;
    store.createCard(board.id, column.id, "Task");
    const card = getState().cards[0]!;
    const label = store.createLabel(board.id, "Priority", "ember" as LabelColorId);

    store.toggleLabel(card.id, label.id);
    store.toggleLabel(card.id, label.id);

    expect(getState().cards.find((c) => c.id === card.id)?.labelIds).toEqual([]);
  });

  it("enforces the collaborator quota", () => {
    for (let i = 1; i < FREE_PLAN.maxCollaborators; i++) {
      store.addMember(`Member ${i}`);
    }
    expect(() => store.addMember("Over limit")).toThrow();
  });
});

describe("comments and filters", () => {
  it("adds comments with activity records", () => {
    const board = store.createBoard("Board", "workspace");
    const column = getState().columns.filter((c) => c.boardId === board.id)[0]!;
    store.createCard(board.id, column.id, "Task");
    const card = getState().cards[0]!;

    store.addComment(card.id, "Looks good");

    expect(getState().comments[0]?.body).toBe("Looks good");
    expect(getState().activity[0]?.action).toBe("comment-added");
  });

  it("saves and lists filters", () => {
    const board = store.createBoard("Board", "workspace");
    store.saveFilter(board.id, "Urgent", { due: "overdue" });
    expect(getState().savedFilters[0]?.name).toBe("Urgent");
  });
});

describe("persistence", () => {
  it("round-trips through localStorage", () => {
    const board = store.createBoard("Persisted", "private");
    expect(localStorage.getItem("column-task-board:v1")).not.toBeNull();
    const raw = JSON.parse(localStorage.getItem("column-task-board:v1")!) as {
      boards: { id: string }[];
    };
    expect(raw.boards[0]?.id).toBe(board.id);
  });
});
