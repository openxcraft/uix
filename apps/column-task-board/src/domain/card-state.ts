import type { Card, CardPhase, ChecklistItem } from "./types";

export function cardPhase(card: Card): CardPhase {
  if (card.deletedAt !== null) return "deleted";
  if (card.archived) return "archived";
  if (card.completed) return "complete";
  return "active";
}

export function isOverdue(card: Card, now: Date): boolean {
  return card.dueAt !== null && !card.completed && new Date(card.dueAt).getTime() <= now.getTime();
}

export function isDueToday(card: Card, now: Date): boolean {
  if (card.dueAt === null) return false;
  const due = new Date(card.dueAt);
  return sameDay(due, now);
}

export function isDueWithinWeek(card: Card, now: Date): boolean {
  if (card.dueAt === null) return false;
  const t = new Date(card.dueAt).getTime();
  return t > now.getTime() && t <= now.getTime() + 7 * 86400_000;
}

export function checklistProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
