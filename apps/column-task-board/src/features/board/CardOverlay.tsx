import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../App";
import { store } from "../../data/store";
import { checklistProgress } from "../../domain/card-state";
import type { LabelColorId } from "../../domain/types";
import { Badge, Button, Field, Input, Modal, Select, TextArea } from "../../shared/ui";
import { strings } from "../../i18n/strings";

const LABEL_COLORS: LabelColorId[] = [
  "ember",
  "teal",
  "green",
  "amber",
  "red",
  "blue",
  "gray",
  "ember-deep",
  "teal-deep",
  "red-deep",
];

export function CardOverlay({ cardId }: { cardId: string }) {
  const navigate = useNavigate();
  const card = useStore((s) => s.cards.find((c) => c.id === cardId));
  const boardId = card?.boardId;
  const labels = useStore((s) => s.labels);
  const members = useStore((s) => s.members);
  const columns = useStore((s) => s.columns);
  const checklists = useStore((s) => s.checklists);
  const checklistItems = useStore((s) => s.checklistItems);
  const comments = useStore((s) => s.comments);
  const boardLabels = useMemo(
    () => (boardId === undefined ? [] : labels.filter((l) => l.boardId === boardId)),
    [labels, boardId],
  );
  const boardColumns = useMemo(
    () =>
      boardId === undefined ? [] : columns.filter((c) => c.boardId === boardId && !c.archived),
    [columns, boardId],
  );
  const cardChecklists = useMemo(
    () => checklists.filter((c) => c.cardId === cardId),
    [checklists, cardId],
  );
  const cardComments = useMemo(
    () => comments.filter((c) => c.cardId === cardId),
    [comments, cardId],
  );

  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [dueAt, setDueAt] = useState(card?.dueAt?.slice(0, 10) ?? "");
  const [commentBody, setCommentBody] = useState("");
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState<LabelColorId>("ember");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (card === undefined || card.deletedAt !== null) {
    return null;
  }

  const close = () => {
    if (title.trim() !== "" && title !== card.title)
      store.updateCard(card.id, { title: title.trim(), description });
    else if (description !== card.description)
      store.updateCard(card.id, { title: card.title, description });
    navigate(`/boards/${card.boardId}`);
  };

  return (
    <Modal title={card.title} onClose={close} wide>
      <div className="flex flex-col gap-6 p-6">
        <Field label={strings.cardTitle}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={16384}
            aria-label={strings.cardTitle}
          />
        </Field>

        <Field label={strings.description}>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            aria-label={strings.description}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={strings.dueDate}>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dueAt}
                onChange={(e) => {
                  setDueAt(e.target.value);
                  store.setDue(
                    card.id,
                    e.target.value === ""
                      ? null
                      : new Date(`${e.target.value}T12:00:00`).toISOString(),
                  );
                }}
                aria-label={strings.dueDate}
              />
              <Button
                onClick={() => {
                  setDueAt("");
                  store.setDue(card.id, null);
                }}
              >
                {strings.clear}
              </Button>
            </div>
          </Field>
          <Field label={strings.columns}>
            <Select
              value={card.columnId}
              onChange={(e) => store.moveCard(card.id, e.target.value, null)}
              aria-label={strings.columns}
            >
              {boardColumns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <section aria-label={strings.labels}>
          <h3 className="mb-2 text-sm font-medium text-text-secondary">{strings.labels}</h3>
          <div className="flex flex-wrap gap-2">
            {boardLabels.map((label) => {
              const active = card.labelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => store.toggleLabel(card.id, label.id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors ${active ? `bg-label-${label.color}/20 text-label-${label.color}` : "bg-secondary text-text-secondary"}`}
                >
                  <span
                    className={`size-2 rounded-full bg-label-${label.color}`}
                    aria-hidden="true"
                  />
                  {label.name}
                </button>
              );
            })}
          </div>
          <form
            className="mt-2 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (labelName.trim() === "") return;
              const label = store.createLabel(card.boardId, labelName.trim(), labelColor);
              store.toggleLabel(card.id, label.id);
              setLabelName("");
            }}
          >
            <Input
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder={strings.labelName}
              maxLength={32}
              aria-label={strings.labelName}
              className="w-40"
            />
            <Select
              value={labelColor}
              onChange={(e) => setLabelColor(e.target.value as LabelColorId)}
              aria-label={`${strings.labelName} color`}
            >
              {LABEL_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Button type="submit">+ {strings.addLabel}</Button>
          </form>
        </section>

        <section aria-label={strings.members}>
          <h3 className="mb-2 text-sm font-medium text-text-secondary">{strings.members}</h3>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const active = card.memberIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => store.toggleMember(card.id, m.id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm ${active ? "bg-primary text-on-primary" : "bg-secondary text-text-secondary"}`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label={strings.checklists}>
          <h3 className="mb-2 text-sm font-medium text-text-secondary">{strings.checklists}</h3>
          {cardChecklists.length === 0 && (
            <p className="text-sm text-text-muted">{strings.noChecklists}</p>
          )}
          {cardChecklists.map((checklist) => {
            const items = checklistItems.filter((i) => i.checklistId === checklist.id);
            const progress = checklistProgress(items);
            return (
              <div key={checklist.id} className="mb-4">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-text-primary">{checklist.title}</h4>
                  <span className="text-xs text-text-secondary">{strings.progress(progress)}</span>
                </div>
                <div
                  className="mb-2 h-1.5 rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={checklist.title}
                >
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <ul className="flex flex-col gap-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <label className="flex min-h-11 items-center gap-2 text-sm text-text-primary">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => store.toggleChecklistItem(item.id)}
                          className="size-5 accent-[var(--color-semantic-interactive-primary-default)]"
                        />
                        <span className={item.done ? "text-text-muted line-through" : ""}>
                          {item.text}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <form
                  className="mt-1 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem("item") as HTMLInputElement;
                    if (input.value.trim() !== "")
                      store.addChecklistItem(checklist.id, input.value.trim());
                    input.value = "";
                  }}
                >
                  <Input
                    name="item"
                    placeholder={strings.addItem}
                    maxLength={256}
                    aria-label={strings.addItem}
                  />
                  <Button type="submit">+</Button>
                </form>
              </div>
            );
          })}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("checklist") as HTMLInputElement;
              if (input.value.trim() !== "") store.addChecklist(card.id, input.value.trim());
              input.value = "";
            }}
          >
            <Input
              name="checklist"
              placeholder={strings.checklistTitle}
              maxLength={64}
              aria-label={strings.checklistTitle}
            />
            <Button type="submit">+ {strings.addChecklist}</Button>
          </form>
        </section>

        <section aria-label={strings.comments}>
          <h3 className="mb-2 text-sm font-medium text-text-secondary">{strings.comments}</h3>
          {cardComments.length === 0 && (
            <p className="text-sm text-text-muted">{strings.noComments}</p>
          )}
          <ul className="mb-2 flex flex-col gap-2">
            {cardComments.map((comment) => (
              <li key={comment.id} className="rounded-md bg-surface-raised p-3 text-sm">
                <span className="font-medium text-text-primary">
                  {members.find((m) => m.id === comment.authorId)?.name ?? comment.authorId}
                </span>
                <span className="ms-2 text-xs text-text-muted">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
                <p className="mt-1 text-text-primary">{comment.body}</p>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (commentBody.trim() === "") return;
              store.addComment(card.id, commentBody.trim());
              setCommentBody("");
            }}
          >
            <Input
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder={strings.commentPlaceholder}
              maxLength={4096}
              aria-label={strings.commentPlaceholder}
            />
            <Button type="submit" variant="primary">
              {strings.send}
            </Button>
          </form>
        </section>

        <footer className="flex flex-wrap items-center gap-2 border-t border-border-default pt-4">
          {card.archived ? (
            <Button onClick={() => store.restoreCard(card.id)}>{strings.restore}</Button>
          ) : (
            <Button onClick={() => store.archiveCard(card.id)}>{strings.archive}</Button>
          )}
          <Button
            variant={card.completed ? "secondary" : "primary"}
            onClick={() => store.setCompleted(card.id, !card.completed)}
          >
            {card.completed ? strings.restore : "✓"}
          </Button>
          {confirmDelete ? (
            <>
              <span className="text-sm text-danger-fg">{strings.confirmDelete}</span>
              <Button
                variant="danger"
                onClick={() => {
                  store.deleteCard(card.id);
                  navigate(`/boards/${card.boardId}`);
                }}
              >
                {strings.delete}
              </Button>
              <Button onClick={() => setConfirmDelete(false)}>{strings.cancel}</Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              {strings.delete}
            </Button>
          )}
          <span className="ms-auto">
            {card.dueAt !== null &&
              new Date(card.dueAt).getTime() <= Date.now() &&
              !card.completed && <Badge tone="danger">{strings.overdue}</Badge>}
          </span>
        </footer>
      </div>
    </Modal>
  );
}
