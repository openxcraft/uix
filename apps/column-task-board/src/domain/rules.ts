import type { Card, FilterCriteria, Rule, RuleAction, Trigger } from "./types";
import { isOverdue, isDueToday, isDueWithinWeek } from "./card-state";

export interface RuleEvent {
  type: Trigger["type"];
  cardId: string;
  columnId?: string;
  labelId?: string;
}

export function ruleMatches(rule: Rule, event: RuleEvent): boolean {
  if (!rule.enabled) return false;
  switch (rule.trigger.type) {
    case "card-moved-to-column":
      return event.type === "card-moved-to-column" && event.columnId === rule.trigger.columnId;
    case "due-date-reached":
      return event.type === "due-date-reached";
    case "label-added":
      return event.type === "label-added" && event.labelId === rule.trigger.labelId;
    case "checklist-completed":
      return event.type === "checklist-completed";
  }
}

export function isValidActions(actions: RuleAction[]): boolean {
  return actions.length >= 1 && actions.length <= 3;
}

export function applyAction(card: Card, action: RuleAction, now: Date): Card {
  switch (action.type) {
    case "move-card":
      return action.columnId ? { ...card, columnId: action.columnId } : card;
    case "set-due": {
      const days = action.days ?? 1;
      return { ...card, dueAt: new Date(now.getTime() + days * 86400_000).toISOString() };
    }
    case "clear-due":
      return { ...card, dueAt: null };
    case "add-label":
      return action.labelId && !card.labelIds.includes(action.labelId)
        ? { ...card, labelIds: [...card.labelIds, action.labelId] }
        : card;
    case "remove-label":
      return { ...card, labelIds: card.labelIds.filter((id) => id !== action.labelId) };
    case "archive-card":
      return { ...card, archived: true };
    case "mark-complete":
      return { ...card, completed: true };
  }
}

export function matchesFilter(card: Card, criteria: FilterCriteria, now: Date): boolean {
  if (
    criteria.q !== undefined &&
    criteria.q !== "" &&
    !card.title.toLowerCase().includes(criteria.q.toLowerCase())
  ) {
    return false;
  }
  if (criteria.labelIds !== undefined && criteria.labelIds.length > 0) {
    if (!criteria.labelIds.some((id) => card.labelIds.includes(id))) return false;
  }
  if (criteria.memberId !== undefined && !card.memberIds.includes(criteria.memberId)) return false;
  switch (criteria.due) {
    case undefined:
      break;
    case "none":
      if (card.dueAt !== null) return false;
      break;
    case "overdue":
      if (!isOverdue(card, now)) return false;
      break;
    case "today":
      if (!isDueToday(card, now)) return false;
      break;
    case "week":
      if (!isDueWithinWeek(card, now)) return false;
      break;
  }
  return true;
}
