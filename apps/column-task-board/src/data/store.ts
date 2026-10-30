import type {
  ActivityAction,
  ActivityEntry,
  AppState,
  Board,
  Card,
  Checklist,
  ChecklistItem,
  Column,
  Comment,
  FilterCriteria,
  Id,
  Label,
  LabelColorId,
  Member,
  Rule,
  RuleAction,
  SavedFilter,
  Trigger,
  Visibility,
} from "../domain/types";
import { densePositions, midpoint, needsResequence } from "../domain/positions";
import { assertBoardQuota, assertRuleRuns, FREE_PLAN, QuotaError } from "../domain/quotas";
import { applyAction, ruleMatches, type RuleEvent } from "../domain/rules";
import { checklistProgress } from "../domain/card-state";
import { enqueue } from "./api-client";

const STORAGE_KEY = "column-task-board:v1";

function uid(): Id {
  return crypto.randomUUID();
}

function emptyState(): AppState {
  return {
    boards: [],
    columns: [],
    cards: [],
    labels: [],
    members: [{ id: "local-owner", name: "Owner" }],
    checklists: [],
    checklistItems: [],
    comments: [],
    activity: [],
    rules: [],
    savedFilters: [],
    currentUserId: "local-owner",
    ruleRunMonth: currentMonth(),
    ruleRuns: 0,
    dueEventsFired: [],
    quotaNoticeMonth: "",
  };
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return emptyState();
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.boards) || !Array.isArray(parsed.cards)) return emptyState();
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

let state: AppState = loadState();
const listeners = new Set<() => void>();

function currentMonthRollover(): void {
  const m = currentMonth();
  if (state.ruleRunMonth !== m) {
    state = { ...state, ruleRunMonth: m, ruleRuns: 0, dueEventsFired: [] };
  }
}

function setState(next: AppState): void {
  currentMonthRollover();
  state = next;
  persist();
  for (const l of listeners) l();
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

export function getState(): AppState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function record(
  next: AppState,
  action: ActivityAction,
  detail: string,
  boardId: Id | null,
  cardId: Id | null,
): AppState {
  const entry: ActivityEntry = {
    id: uid(),
    boardId,
    cardId,
    actorId: next.currentUserId,
    action,
    detail,
    at: new Date().toISOString(),
  };
  return { ...next, activity: [entry, ...next.activity] };
}

function patchCard(next: AppState, cardId: Id, patch: Partial<Card>): AppState {
  const cards = next.cards.map((c) =>
    c.id === cardId ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
  );
  return resequence(next, cards);
}

function resequence(next: AppState, cards: Card[]): AppState {
  const byColumn = new Map<Id, Card[]>();
  for (const c of cards) {
    const list = byColumn.get(c.columnId) ?? [];
    list.push(c);
    byColumn.set(c.columnId, list);
  }
  let out: Card[] | null = null;
  let indexById: Map<Id, number> | null = null;
  for (const list of byColumn.values()) {
    if (!needsResequence(list.map((c) => c.position))) continue;
    if (out === null) {
      out = [...cards];
      indexById = new Map(cards.map((card, index) => [card.id, index]));
    }
    const sorted = [...list].sort((a, b) => a.position - b.position);
    const positions = densePositions(sorted.length);
    sorted.forEach((c, i) => {
      const target = indexById!.get(c.id);
      if (target !== undefined) out![target] = { ...c, position: positions[i]! };
    });
  }
  return out === null ? { ...next, cards } : { ...next, cards: out };
}

function dispatchEvents(next: AppState, events: RuleEvent[]): AppState {
  let current = next;
  for (const event of events) {
    for (const rule of current.rules) {
      if (!ruleMatches(rule, event)) continue;
      if (!assertRuleRuns(current.ruleRuns, FREE_PLAN)) {
        if (current.quotaNoticeMonth !== current.ruleRunMonth) {
          current = record(
            { ...current, quotaNoticeMonth: current.ruleRunMonth },
            "rule-skipped-quota",
            `rule ${rule.id}: monthly limit ${FREE_PLAN.maxRuleRunsPerMonth} reached`,
            rule.boardId,
            event.cardId,
          );
        }
        continue;
      }
      const card = current.cards.find((c) => c.id === event.cardId);
      if (!card) continue;
      let updated = card;
      for (const action of rule.actions) {
        updated = applyAction(updated, action as RuleAction, new Date());
      }
      current = patchCard(current, card.id, {
        columnId: updated.columnId,
        labelIds: updated.labelIds,
        dueAt: updated.dueAt,
        archived: updated.archived,
        completed: updated.completed,
      });
      current = record(
        { ...current, ruleRuns: current.ruleRuns + 1 },
        "rule-executed",
        `${rule.trigger.type} -> ${rule.actions.map((a) => a.type).join(", ")}`,
        rule.boardId,
        card.id,
      );
    }
  }
  return current;
}

function withSync(next: AppState, method: string, path: string, body?: unknown): AppState {
  enqueue(method, path, body);
  return next;
}

export const store = {
  createBoard(title: string, visibility: Visibility): Board {
    assertBoardQuota(state.boards.length, FREE_PLAN);
    const board: Board = {
      id: uid(),
      title,
      visibility,
      createdAt: new Date().toISOString(),
    };
    const columns: Column[] = ["To do", "Doing", "Done"].map((t, i) => ({
      id: uid(),
      boardId: board.id,
      title: t,
      position: i * 1000,
      archived: false,
    }));
    let next: AppState = {
      ...state,
      boards: [...state.boards, board],
      columns: [...state.columns, ...columns],
    };
    next = record(next, "board-created", `${title} (${visibility})`, board.id, null);
    next = withSync(next, "POST", "/boards", { title, visibility });
    setState(next);
    return board;
  },

  createColumn(boardId: Id, title: string): void {
    const maxPos = Math.max(
      -1,
      ...state.columns.filter((c) => c.boardId === boardId).map((c) => c.position),
    );
    const column: Column = { id: uid(), boardId, title, position: maxPos + 1000, archived: false };
    let next: AppState = { ...state, columns: [...state.columns, column] };
    next = record(next, "column-created", title, boardId, null);
    next = withSync(next, "POST", `/boards/${boardId}/columns`, { title });
    setState(next);
  },

  renameColumn(columnId: Id, title: string): void {
    const column = state.columns.find((c) => c.id === columnId);
    if (!column) return;
    let next: AppState = {
      ...state,
      columns: state.columns.map((c) => (c.id === columnId ? { ...c, title } : c)),
    };
    next = record(next, "column-renamed", title, column.boardId, null);
    next = withSync(next, "PATCH", `/columns/${columnId}`, { title });
    setState(next);
  },

  archiveColumn(columnId: Id): void {
    const column = state.columns.find((c) => c.id === columnId);
    if (!column) return;
    let next: AppState = {
      ...state,
      columns: state.columns.map((c) => (c.id === columnId ? { ...c, archived: !c.archived } : c)),
    };
    next = record(next, "column-archived", column.title, column.boardId, null);
    next = withSync(next, "PATCH", `/columns/${columnId}`, { archived: !column.archived });
    setState(next);
  },

  createCard(boardId: Id, columnId: Id, title: string): void {
    const columnCards = state.cards.filter((c) => c.columnId === columnId);
    const maxPos = Math.max(-1, ...columnCards.map((c) => c.position));
    const now = new Date().toISOString();
    const card: Card = {
      id: uid(),
      boardId,
      columnId,
      title,
      description: "",
      position: maxPos + 1000,
      labelIds: [],
      memberIds: [],
      dueAt: null,
      completed: false,
      archived: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    let next: AppState = { ...state, cards: [...state.cards, card] };
    next = record(next, "card-created", title, boardId, card.id);
    next = withSync(next, "POST", `/boards/${boardId}/cards`, { columnId, title });
    setState(next);
  },

  updateCard(cardId: Id, patch: Pick<Card, "title" | "description">): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    let next = patchCard(state, cardId, patch);
    next = record(next, "card-updated", patch.title, card.boardId, cardId);
    next = withSync(next, "PATCH", `/cards/${cardId}`, patch);
    setState(next);
  },

  moveCard(cardId: Id, columnId: Id, beforeCardId: Id | null): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const columnCards = state.cards
      .filter(
        (c) => c.columnId === columnId && c.id !== cardId && !c.archived && c.deletedAt === null,
      )
      .sort((a, b) => a.position - b.position);
    let before: number | undefined;
    let after: number | undefined;
    if (beforeCardId === null) {
      after = columnCards.length > 0 ? columnCards[0]!.position : undefined;
    } else {
      const idx = columnCards.findIndex((c) => c.id === beforeCardId);
      if (idx === -1) {
        after = columnCards.length > 0 ? columnCards[0]!.position : undefined;
      } else {
        before = columnCards[idx]!.position;
        after = columnCards[idx + 1]?.position;
      }
    }
    const position = midpoint(before, after);
    let next = patchCard(state, cardId, { columnId, position });
    const events: RuleEvent[] = [{ type: "card-moved-to-column", cardId, columnId }];
    next = record(next, "card-moved", `${card.title}`, card.boardId, cardId);
    next = dispatchEvents(next, events);
    next = withSync(next, "POST", `/cards/${cardId}/move`, {
      columnId,
      position: Math.round(position),
    });
    setState(next);
  },

  moveCardWithinColumn(cardId: Id, direction: -1 | 1): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const columnCards = state.cards
      .filter((c) => c.columnId === card.columnId && !c.archived && c.deletedAt === null)
      .sort((a, b) => a.position - b.position);
    const idx = columnCards.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const target = direction === -1 ? idx - 1 : idx + 1;
    if (target < 0 || target >= columnCards.length) return;
    const neighbor = columnCards[target]!;
    const before = direction === -1 ? columnCards[target - 1]?.position : neighbor.position;
    const after = direction === -1 ? neighbor.position : columnCards[target + 1]?.position;
    const position = midpoint(before, after);
    let next = patchCard(state, cardId, { position });
    next = record(next, "card-moved", card.title, card.boardId, cardId);
    next = withSync(next, "POST", `/cards/${cardId}/move`, { columnId: card.columnId, position });
    setState(next);
  },

  setCompleted(cardId: Id, completed: boolean): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    let next = patchCard(state, cardId, { completed });
    next = record(next, "card-completed", card.title, card.boardId, cardId);
    next = withSync(next, "PATCH", `/cards/${cardId}`, { completed });
    setState(next);
  },

  setDue(cardId: Id, dueAt: string | null): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    let next = patchCard(state, cardId, { dueAt });
    next = record(next, "due-set", dueAt ?? "cleared", card.boardId, cardId);
    next = withSync(next, "PATCH", `/cards/${cardId}`, { dueAt });
    setState(next);
  },

  toggleLabel(cardId: Id, labelId: Id): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const has = card.labelIds.includes(labelId);
    const labelIds = has ? card.labelIds.filter((l) => l !== labelId) : [...card.labelIds, labelId];
    let next = patchCard(state, cardId, { labelIds });
    next = record(next, "label-toggled", labelId, card.boardId, cardId);
    const events: RuleEvent[] = has ? [] : [{ type: "label-added", cardId, labelId }];
    next = dispatchEvents(next, events);
    next = withSync(next, "PATCH", `/cards/${cardId}`, { labelIds });
    setState(next);
  },

  createLabel(boardId: Id, name: string, color: LabelColorId): Label {
    const existing = state.labels.filter((l) => l.boardId === boardId);
    if (existing.some((l) => l.name === name && l.color === color)) {
      return existing.find((l) => l.name === name && l.color === color)!;
    }
    const label: Label = { id: uid(), boardId, name, color };
    setState({ ...state, labels: [...state.labels, label] });
    return label;
  },

  toggleMember(cardId: Id, memberId: Id): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const has = card.memberIds.includes(memberId);
    const memberIds = has
      ? card.memberIds.filter((m) => m !== memberId)
      : [...card.memberIds, memberId];
    let next = patchCard(state, cardId, { memberIds });
    next = record(next, "member-assigned", memberId, card.boardId, cardId);
    next = withSync(next, "PATCH", `/cards/${cardId}`, { memberIds });
    setState(next);
  },

  addMember(name: string): void {
    if (state.members.length >= FREE_PLAN.maxCollaborators)
      throw new QuotaError(FREE_PLAN.maxCollaborators);
    const member: Member = { id: uid(), name };
    setState({ ...state, members: [...state.members, member] });
  },

  archiveCard(cardId: Id): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    let next = patchCard(state, cardId, { archived: true });
    next = record(next, "card-archived", card.title, card.boardId, cardId);
    next = withSync(next, "POST", `/cards/${cardId}/archive`, {});
    setState(next);
  },

  restoreCard(cardId: Id): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    let next = patchCard(state, cardId, { archived: false });
    next = record(next, "card-restored", card.title, card.boardId, cardId);
    next = withSync(next, "POST", `/cards/${cardId}/restore`, {});
    setState(next);
  },

  deleteCard(cardId: Id): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    let next = patchCard(state, cardId, { deletedAt: new Date().toISOString() });
    next = record(next, "card-deleted", card.title, card.boardId, cardId);
    next = withSync(next, "DELETE", `/cards/${cardId}`, undefined);
    setState(next);
  },

  addChecklist(cardId: Id, title: string): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const maxPos = Math.max(
      -1,
      ...state.checklists.filter((c) => c.cardId === cardId).map((c) => c.position),
    );
    const checklist: Checklist = { id: uid(), cardId, title, position: maxPos + 1000 };
    let next: AppState = { ...state, checklists: [...state.checklists, checklist] };
    next = record(next, "checklist-added", title, card.boardId, cardId);
    next = withSync(next, "POST", `/cards/${cardId}/checklists`, { title });
    setState(next);
  },

  addChecklistItem(checklistId: Id, text: string): void {
    const checklist = state.checklists.find((c) => c.id === checklistId);
    if (!checklist) return;
    const item: ChecklistItem = {
      id: uid(),
      checklistId,
      text,
      done: false,
      assigneeId: null,
      dueAt: null,
    };
    setState({ ...state, checklistItems: [...state.checklistItems, item] });
  },

  toggleChecklistItem(itemId: Id): void {
    const item = state.checklistItems.find((i) => i.id === itemId);
    if (!item) return;
    const checklist = state.checklists.find((c) => c.id === item.checklistId);
    if (!checklist) return;
    const card = state.cards.find((c) => c.id === checklist.cardId);
    if (!card) return;
    const done = !item.done;
    let next: AppState = {
      ...state,
      checklistItems: state.checklistItems.map((i) => (i.id === itemId ? { ...i, done } : i)),
    };
    next = record(
      next,
      "item-toggled",
      `${item.text}: ${done ? "done" : "open"}`,
      card.boardId,
      card.id,
    );
    const items = next.checklistItems.filter((i) => i.checklistId === item.checklistId);
    const events: RuleEvent[] =
      done && checklistProgress(items) === 100
        ? [{ type: "checklist-completed", cardId: card.id }]
        : [];
    next = dispatchEvents(next, events);
    next = withSync(next, "PATCH", `/checklist-items/${itemId}`, { done });
    setState(next);
  },

  addComment(cardId: Id, body: string): void {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const comment: Comment = {
      id: uid(),
      cardId,
      authorId: state.currentUserId,
      body,
      createdAt: new Date().toISOString(),
    };
    let next: AppState = { ...state, comments: [...state.comments, comment] };
    next = record(next, "comment-added", body.slice(0, 60), card.boardId, cardId);
    next = withSync(next, "POST", `/cards/${cardId}/comments`, { body });
    setState(next);
  },

  createRule(boardId: Id, trigger: Trigger, actions: RuleAction[]): Rule {
    const rule: Rule = { id: uid(), boardId, trigger, actions, enabled: true };
    let next: AppState = { ...state, rules: [...state.rules, rule] };
    next = record(
      next,
      "rule-created",
      `${trigger.type} -> ${actions.map((a) => a.type).join(", ")}`,
      boardId,
      null,
    );
    setState(next);
    return rule;
  },

  toggleRule(ruleId: Id): void {
    const rule = state.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    let next: AppState = {
      ...state,
      rules: state.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    };
    next = record(next, "rule-toggled", `${rule.id}: ${!rule.enabled}`, rule.boardId, null);
    setState(next);
  },

  saveFilter(boardId: Id, name: string, criteria: FilterCriteria): void {
    const filter: SavedFilter = { id: uid(), boardId, name, criteria };
    let next: AppState = { ...state, savedFilters: [...state.savedFilters, filter] };
    next = record(next, "filter-saved", name, boardId, null);
    setState(next);
  },

  deleteSavedFilter(filterId: Id): void {
    setState({ ...state, savedFilters: state.savedFilters.filter((f) => f.id !== filterId) });
  },

  fireDueEvents(now: Date): void {
    const due = state.cards.filter(
      (c) =>
        c.dueAt !== null &&
        !c.completed &&
        !c.archived &&
        c.deletedAt === null &&
        new Date(c.dueAt).getTime() <= now.getTime() &&
        !state.dueEventsFired.includes(`${c.id}:${c.dueAt}`),
    );
    if (due.length === 0) return;
    const fired = [...state.dueEventsFired];
    let events: RuleEvent[] = [];
    let next = state;
    for (const card of due) {
      const key = `${card.id}:${card.dueAt}`;
      fired.push(key);
      events = [...events, { type: "due-date-reached", cardId: card.id }];
    }
    next = { ...next, dueEventsFired: fired };
    next = dispatchEvents(next, events);
    setState(next);
  },
};

export function resetForTests(): void {
  state = emptyState();
  persist();
  for (const l of listeners) l();
}
