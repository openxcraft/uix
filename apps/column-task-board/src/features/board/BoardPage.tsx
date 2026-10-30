import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useStore } from "../../App";
import { FREE_PLAN } from "../../domain/quotas";
import { matchesFilter } from "../../domain/rules";
import type { FilterCriteria } from "../../domain/types";
import { Button, EmptyState, Select } from "../../shared/ui";
import { ThemeToggle } from "../../shared/ThemeToggle";
import { strings } from "../../i18n/strings";
import { BoardView } from "./BoardView";
import { TableView } from "./TableView";
import { CalendarView } from "./CalendarView";
import { CardOverlay } from "./CardOverlay";
import { RulesPanel } from "./RulesPanel";
import { ActivityFeed } from "./ActivityFeed";
import { FilterBar } from "./FilterBar";

type ViewMode = "board" | "table" | "calendar";

export function BoardPage() {
  const { boardId = "", cardId } = useParams();
  const board = useStore((s) => s.boards.find((b) => b.id === boardId));
  const cards = useStore((s) => s.cards);
  const ruleRuns = useStore((s) => s.ruleRuns);
  const [view, setView] = useState<ViewMode>("board");
  const [criteria, setCriteria] = useState<FilterCriteria>({});
  const [panel, setPanel] = useState<"none" | "rules" | "activity">("none");

  const boardCards = useMemo(() => {
    if (board === undefined) return [];
    const now = new Date();
    return cards.filter(
      (c) =>
        c.boardId === board.id &&
        c.deletedAt === null &&
        !c.archived &&
        matchesFilter(c, criteria, now),
    );
  }, [cards, board, criteria]);

  if (board === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <EmptyState>
          {strings.back} —{" "}
          <Link to="/" className="text-text-accent underline">
            {strings.boards}
          </Link>
        </EmptyState>
      </div>
    );
  }

  const hasFilters =
    (criteria.q !== undefined && criteria.q !== "") ||
    (criteria.labelIds?.length ?? 0) > 0 ||
    criteria.memberId !== undefined ||
    criteria.due !== undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border-default bg-surface-raised p-4">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-text-secondary transition-colors hover:bg-secondary hover:text-text-primary"
          aria-label={strings.boards}
        >
          <svg
            viewBox="0 0 20 20"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="font-display text-lg font-semibold text-text-primary">{board.title}</h1>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-text-secondary">
          {board.visibility === "private" ? strings.private : strings.workspace}
        </span>

        <div className="ms-auto flex items-center gap-2">
          <Select
            aria-label={strings.views.board}
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
            className="min-h-11"
          >
            <option value="board">{strings.views.board}</option>
            <option value="table">{strings.views.table}</option>
            <option value="calendar">{strings.views.calendar}</option>
          </Select>
          <Button onClick={() => setPanel(panel === "rules" ? "none" : "rules")}>
            {strings.rules}
          </Button>
          <Button onClick={() => setPanel(panel === "activity" ? "none" : "activity")}>
            {strings.activity}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <FilterBar boardId={board.id} criteria={criteria} onChange={setCriteria} />

      {view === "board" && <BoardView boardId={board.id} cards={boardCards} />}
      {view === "table" && <TableView boardId={board.id} cards={boardCards} />}
      {view === "calendar" && <CalendarView cards={boardCards} />}

      {hasFilters && boardCards.length === 0 && (
        <p className="p-6 text-sm text-text-secondary">{strings.emptyFiltered}</p>
      )}

      {cardId !== undefined && <CardOverlay cardId={cardId} />}
      {panel === "rules" && (
        <RulesPanel
          boardId={board.id}
          onClose={() => setPanel("none")}
          runs={ruleRuns}
          maxRuns={FREE_PLAN.maxRuleRunsPerMonth}
        />
      )}
      {panel === "activity" && <ActivityFeed boardId={board.id} onClose={() => setPanel("none")} />}
    </div>
  );
}
