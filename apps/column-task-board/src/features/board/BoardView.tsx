import { useState, type DragEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../App";
import { store } from "../../data/store";
import type { Card, Column, Id } from "../../domain/types";
import { Button, Input } from "../../shared/ui";
import { strings } from "../../i18n/strings";
import { CardTile } from "./CardTile";

export function BoardView({ boardId, cards }: { boardId: Id; cards: Card[] }) {
  const columns = useStore((s) => s.columns);
  const boardColumns = columns
    .filter((c) => c.boardId === boardId && !c.archived)
    .sort((a, b) => a.position - b.position);
  const [dragCardId, setDragCardId] = useState<Id | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const navigate = useNavigate();

  const onDragOver = (e: DragEvent, key: string) => {
    e.preventDefault();
    setDropTarget(key);
  };

  const onDrop = (e: DragEvent, columnId: Id, beforeCardId: Id | null) => {
    e.preventDefault();
    const cardId = dragCardId ?? (e.dataTransfer.getData("text/plain") as Id);
    if (cardId !== "") store.moveCard(cardId, columnId, beforeCardId);
    setDragCardId(null);
    setDropTarget(null);
  };

  const onCardKeyDown = (e: KeyboardEvent, card: Card, column: Column, columns: Column[]) => {
    const columnIndex = columns.findIndex((c) => c.id === column.id);
    if (e.key === "Enter") {
      e.preventDefault();
      navigate(`/boards/${boardId}/card/${card.id}`);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      store.moveCardWithinColumn(card.id, -1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      store.moveCardWithinColumn(card.id, 1);
      return;
    }
    if (e.key === "ArrowLeft" && columnIndex > 0) {
      e.preventDefault();
      store.moveCard(card.id, columns[columnIndex - 1]!.id, null);
      setAnnouncement(strings.cardMoved(card.title, columns[columnIndex - 1]!.title));
      return;
    }
    if (e.key === "ArrowRight" && columnIndex < columns.length - 1) {
      e.preventDefault();
      store.moveCard(card.id, columns[columnIndex + 1]!.id, null);
      setAnnouncement(strings.cardMoved(card.title, columns[columnIndex + 1]!.title));
    }
  };

  return (
    <div className="flex flex-1 gap-4 overflow-x-auto p-4">
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {boardColumns.map((column) => (
        <ColumnPanel
          key={column.id}
          column={column}
          cards={cards.filter((c) => c.columnId === column.id)}
          dropTarget={dropTarget}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onCardKeyDown={onCardKeyDown}
          columns={boardColumns}
          boardId={boardId}
          dragCardId={dragCardId}
          onCardDragStart={(id) => setDragCardId(id)}
          onCardDragEnd={() => {
            setDragCardId(null);
            setDropTarget(null);
          }}
        />
      ))}
      <AddColumn boardId={boardId} />
    </div>
  );
}

function ColumnPanel({
  column,
  cards,
  dropTarget,
  onDragOver,
  onDrop,
  onCardKeyDown,
  columns,
  boardId,
  dragCardId,
  onCardDragStart,
  onCardDragEnd,
}: {
  column: Column;
  cards: Card[];
  dropTarget: string | null;
  onDragOver: (e: DragEvent, key: string) => void;
  onDrop: (e: DragEvent, columnId: Id, beforeCardId: Id | null) => void;
  onCardKeyDown: (e: KeyboardEvent, card: Card, column: Column, columns: Column[]) => void;
  columns: Column[];
  boardId: Id;
  dragCardId: Id | null;
  onCardDragStart: (id: Id) => void;
  onCardDragEnd: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [composerOpen, setComposerOpen] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  return (
    <section
      aria-label={column.title}
      className="flex w-72 shrink-0 flex-col rounded-lg bg-surface-raised"
    >
      <header className="flex items-center gap-2 p-3">
        {renaming ? (
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim() !== "") store.renameColumn(column.id, title.trim());
              setRenaming(false);
            }}
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              maxLength={64}
              aria-label={strings.columnTitle}
            />
            <Button type="submit">{strings.save}</Button>
          </form>
        ) : (
          <>
            <h2 className="flex-1 truncate font-medium text-text-primary">{column.title}</h2>
            <span className="text-sm text-text-secondary">{cards.length}</span>
            <button
              type="button"
              aria-label={strings.rename}
              onClick={() => setRenaming(true)}
              className="inline-flex size-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-secondary"
            >
              <svg
                viewBox="0 0 20 20"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M13 3l4 4L7 17H3v-4L13 3z" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={strings.archiveColumn}
              onClick={() => store.archiveColumn(column.id)}
              className="inline-flex size-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-secondary"
            >
              <svg
                viewBox="0 0 20 20"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="4" width="14" height="4" rx="1" />
                <path d="M5 8v8h10V8M8 11h4" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
      </header>

      <div
        className={`flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-2 ${dropTarget === column.id ? "drop-target" : ""}`}
        onDragOver={(e) => onDragOver(e, column.id)}
        onDrop={(e) => onDrop(e, column.id, null)}
      >
        {cards.length === 0 && !composerOpen && (
          <p className="p-2 text-sm text-text-muted">{strings.emptyColumn}</p>
        )}
        {cards.map((card) => (
          <div
            key={card.id}
            onDragOver={(e) => onDragOver(e, `${column.id}:${card.id}`)}
            onDrop={(e) => {
              e.stopPropagation();
              onDrop(e, column.id, card.id);
            }}
            className={dropTarget === `${column.id}:${card.id}` ? "rounded-lg drop-target" : ""}
          >
            <CardTile
              card={card}
              boardId={boardId}
              dragging={dragCardId === card.id}
              onDragStart={onCardDragStart}
              onDragEnd={onCardDragEnd}
              onKeyDown={(e) => onCardKeyDown(e, card, column, columns)}
            />
          </div>
        ))}
      </div>

      <footer className="p-2">
        {composerOpen ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newCardTitle.trim() !== "") {
                store.createCard(boardId, column.id, newCardTitle.trim());
                setNewCardTitle("");
              }
            }}
          >
            <Input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder={strings.cardTitle}
              autoFocus
              aria-label={strings.cardTitle}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary">
                {strings.addCard}
              </Button>
              <Button
                onClick={() => {
                  setComposerOpen(false);
                  setNewCardTitle("");
                }}
              >
                {strings.cancel}
              </Button>
            </div>
          </form>
        ) : (
          <Button className="w-full" onClick={() => setComposerOpen(true)}>
            + {strings.addCard}
          </Button>
        )}
      </footer>
    </section>
  );
}

function AddColumn({ boardId }: { boardId: Id }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  if (!open) {
    return (
      <Button className="h-fit w-72 shrink-0" onClick={() => setOpen(true)}>
        + {strings.addColumn}
      </Button>
    );
  }
  return (
    <form
      className="flex h-fit w-72 shrink-0 flex-col gap-2 rounded-lg bg-surface-raised p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim() !== "") store.createColumn(boardId, title.trim());
        setTitle("");
        setOpen(false);
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={strings.columnTitle}
        autoFocus
        aria-label={strings.columnTitle}
        maxLength={64}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          {strings.create}
        </Button>
        <Button onClick={() => setOpen(false)}>{strings.cancel}</Button>
      </div>
    </form>
  );
}
