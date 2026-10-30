import { useState } from "react";
import { useNavigate } from "react-router";
import type { Card } from "../../domain/types";
import { Badge, Button } from "../../shared/ui";
import { strings } from "../../i18n/strings";
import { isOverdue } from "../../domain/card-state";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d));
    }
    weeks.push(week);
  }
  return weeks;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarView({ cards }: { cards: Card[] }) {
  const navigate = useNavigate();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const weeks = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const withDue = cards.filter((c) => c.dueAt !== null);

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <Button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
          ‹
        </Button>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <Button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
          ›
        </Button>
        <Button
          className="ms-auto"
          onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
        >
          {strings.today}
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-text-secondary">
        {WEEKDAYS.map((d) => (
          <div key={d} className="p-2 text-center font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-1">
        {weeks.flat().map((day) => {
          const dayCards = withDue.filter(
            (c) => c.dueAt !== null && sameDay(new Date(c.dueAt), day),
          );
          const inMonth = day.getMonth() === cursor.getMonth();
          return (
            <div
              key={day.toISOString()}
              className={`min-h-20 rounded-md border p-1 ${inMonth ? "border-border-default bg-surface-raised" : "border-transparent bg-surface-sunken/40"}`}
            >
              <span
                className={`text-xs ${sameDay(day, today) ? "font-bold text-text-accent" : "text-text-secondary"}`}
              >
                {day.getDate()}
              </span>
              <ul className="mt-1 flex flex-col gap-1">
                {dayCards.map((card) => (
                  <li key={card.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/boards/${card.boardId}/card/${card.id}`)}
                      className="w-full truncate rounded bg-secondary px-1.5 py-0.5 text-start text-xs text-text-primary transition-colors hover:bg-secondary-hover"
                    >
                      {isOverdue(card, new Date()) && !card.completed ? (
                        <Badge tone="danger">!</Badge>
                      ) : null}
                      {card.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {withDue.length === 0 && (
        <p className="mt-3 text-sm text-text-secondary">{strings.noDueCards}</p>
      )}
    </div>
  );
}
