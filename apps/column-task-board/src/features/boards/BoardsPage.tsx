import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useStore } from "../../App";
import { store } from "../../data/store";
import { FREE_PLAN, QuotaError } from "../../domain/quotas";
import { Button, EmptyState, Field, Input, Select } from "../../shared/ui";
import { ThemeToggle } from "../../shared/ThemeToggle";
import { strings } from "../../i18n/strings";

export function BoardsPage() {
  const boards = useStore((s) => s.boards);
  const cards = useStore((s) => s.cards);
  const columns = useStore((s) => s.columns);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"private" | "workspace">("workspace");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") return;
    try {
      store.createBoard(title.trim(), visibility);
      setTitle("");
      setError(null);
    } catch (err) {
      if (err instanceof QuotaError) setError(strings.quotaReached(err.limit));
      else throw err;
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">{strings.appName}</h1>
        <ThemeToggle />
      </header>

      <section aria-labelledby="boards-heading">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="boards-heading" className="font-display text-lg font-semibold text-text-primary">
            {strings.boards}
          </h2>
          <span className="text-sm text-text-secondary">
            {strings.boardQuota(boards.length, FREE_PLAN.maxBoards)}
          </span>
        </div>
        {boards.length === 0 ? (
          <EmptyState>{strings.emptyBoards}</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {boards.map((board) => {
              const boardCards = cards.filter(
                (c) => c.boardId === board.id && c.deletedAt === null && !c.archived,
              );
              const boardColumns = columns.filter((c) => c.boardId === board.id && !c.archived);
              return (
                <li key={board.id}>
                  <Link
                    to={`/boards/${board.id}`}
                    className="flex min-h-16 items-center justify-between rounded-lg border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong"
                  >
                    <span>
                      <span className="block font-medium text-text-primary">{board.title}</span>
                      <span className="text-sm text-text-secondary">
                        {strings.cardCount(boardCards.length)} · {boardColumns.length}{" "}
                        {strings.columns.toLowerCase()}
                      </span>
                    </span>
                    <span className="text-sm text-text-accent">{strings.open}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form onSubmit={onSubmit} className="flex flex-col gap-3" aria-label={strings.newBoard}>
        <Field label={strings.boardTitle}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={strings.boardTitle}
            maxLength={120}
            required
          />
        </Field>
        <Field label={strings.visibility}>
          <Select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "private" | "workspace")}
          >
            <option value="workspace">{strings.workspace}</option>
            <option value="private">{strings.private}</option>
          </Select>
        </Field>
        {error !== null && (
          <p role="alert" className="rounded-md bg-danger-bg p-3 text-sm text-danger-fg">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" className="self-start">
          {strings.create}
        </Button>
      </form>
    </div>
  );
}
