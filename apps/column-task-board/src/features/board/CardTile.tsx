import { useMemo, type DragEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../App";
import { checklistProgress, isOverdue } from "../../domain/card-state";
import type { Card, Id } from "../../domain/types";
import { Badge } from "../../shared/ui";
import { strings } from "../../i18n/strings";

export function CardTile({
  card,
  boardId,
  dragging,
  onDragStart,
  onDragEnd,
  onKeyDown,
}: {
  card: Card;
  boardId: Id;
  dragging: boolean;
  onDragStart: (id: Id) => void;
  onDragEnd: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}) {
  const navigate = useNavigate();
  const labels = useStore((s) => s.labels);
  const members = useStore((s) => s.members);
  const checklists = useStore((s) => s.checklists);
  const checklistItems = useStore((s) => s.checklistItems);
  const items = useMemo(
    () =>
      checklistItems.filter((i) =>
        checklists.some((c) => c.id === i.checklistId && c.cardId === card.id),
      ),
    [checklistItems, checklists, card.id],
  );
  const cardLabels = useMemo(
    () => labels.filter((l) => l.boardId === boardId && card.labelIds.includes(l.id)),
    [labels, boardId, card.labelIds],
  );
  const cardMembers = useMemo(
    () => members.filter((m) => card.memberIds.includes(m.id)),
    [members, card.memberIds],
  );

  const overdue = isOverdue(card, new Date());
  const progress = checklistProgress(items);

  const dragProps = {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.setData("text/plain", card.id);
      onDragStart(card.id);
    },
    onDragEnd,
  };

  return (
    <div
      {...dragProps}
      role="button"
      tabIndex={0}
      aria-label={`${card.title}. ${strings.keyboardHint}`}
      onKeyDown={onKeyDown}
      onClick={() => navigate(`/boards/${boardId}/card/${card.id}`)}
      className={`cursor-grab rounded-lg border border-border-default bg-surface-overlay p-3 text-start shadow-sm transition-shadow hover:shadow-md ${dragging ? "opacity-55" : ""}`}
    >
      {cardLabels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {cardLabels.map((label) => (
            <span
              key={label.id}
              className={`inline-flex items-center gap-1 rounded-full bg-label-${label.color}/15 px-2 py-0.5 text-xs font-medium text-label-${label.color}`}
            >
              <span className={`size-2 rounded-full bg-label-${label.color}`} aria-hidden="true" />
              {label.name}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm font-medium text-text-primary">{card.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {card.dueAt !== null && (
          <Badge tone={overdue ? "danger" : card.completed ? "success" : "neutral"}>
            {overdue ? `${strings.overdue} · ` : ""}
            {new Date(card.dueAt).toLocaleDateString()}
          </Badge>
        )}
        {card.completed && <Badge tone="success">✓</Badge>}
        {checklists.length > 0 && (
          <span className="text-xs text-text-secondary">{strings.progress(progress)}</span>
        )}
        {card.description !== "" && (
          <svg
            viewBox="0 0 20 20"
            className="size-4 text-text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-label={strings.description}
          >
            <path d="M5 6h10M5 10h10M5 14h6" strokeLinecap="round" />
          </svg>
        )}
        <span className="ms-auto flex -space-x-2">
          {cardMembers.map((m) => (
            <span
              key={m.id}
              title={m.name}
              className="inline-flex size-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-text-secondary ring-2 ring-surface-overlay"
            >
              {m.name.slice(0, 2).toUpperCase()}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
