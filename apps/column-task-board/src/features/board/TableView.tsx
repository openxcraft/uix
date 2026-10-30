import { useState } from "react";
import { useStore } from "../../App";
import { store } from "../../data/store";
import type { Card, Id } from "../../domain/types";
import { Badge, Input } from "../../shared/ui";
import { strings } from "../../i18n/strings";
import { isOverdue } from "../../domain/card-state";

export function TableView({ boardId, cards }: { boardId: Id; cards: Card[] }) {
  const columns = useStore((s) => s.columns.filter((c) => c.boardId === boardId && !c.archived));
  const labels = useStore((s) => s.labels.filter((l) => l.boardId === boardId));
  const members = useStore((s) => s.members);
  const [editingId, setEditingId] = useState<Id | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const sorted = [...cards].sort(
    (a, b) =>
      columns.findIndex((c) => c.id === a.columnId) -
        columns.findIndex((c) => c.id === b.columnId) || a.position - b.position,
  );

  return (
    <div className="overflow-x-auto p-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-default text-start text-xs text-text-secondary">
            <th scope="col" className="p-3 text-start font-medium">
              {strings.tableTitle}
            </th>
            <th scope="col" className="p-3 text-start font-medium">
              {strings.tableColumn}
            </th>
            <th scope="col" className="p-3 text-start font-medium">
              {strings.tableLabels}
            </th>
            <th scope="col" className="p-3 text-start font-medium">
              {strings.tableDue}
            </th>
            <th scope="col" className="p-3 text-start font-medium">
              {strings.tableMembers}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((card) => (
            <tr key={card.id} className="border-b border-border-default">
              <td className="p-3">
                {editingId === card.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editTitle.trim() !== "")
                        store.updateCard(card.id, {
                          title: editTitle.trim(),
                          description: card.description,
                        });
                      setEditingId(null);
                    }}
                  >
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      aria-label={strings.cardTitle}
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    className="w-full truncate text-start text-text-primary hover:text-text-accent"
                    onClick={() => {
                      setEditingId(card.id);
                      setEditTitle(card.title);
                    }}
                  >
                    {card.title}
                  </button>
                )}
              </td>
              <td className="p-3 text-text-secondary">
                {columns.find((c) => c.id === card.columnId)?.title}
              </td>
              <td className="p-3">
                <span className="flex flex-wrap gap-1">
                  {labels
                    .filter((l) => card.labelIds.includes(l.id))
                    .map((l) => (
                      <Badge key={l.id}>{l.name}</Badge>
                    ))}
                </span>
              </td>
              <td className="p-3">
                {card.dueAt !== null && (
                  <Badge tone={isOverdue(card, new Date()) ? "danger" : "neutral"}>
                    {new Date(card.dueAt).toLocaleDateString()}
                  </Badge>
                )}
              </td>
              <td className="p-3 text-text-secondary">
                {members
                  .filter((m) => card.memberIds.includes(m.id))
                  .map((m) => m.name)
                  .join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
