# column-task-board

Single-page application implementing SPEC-000010001: a column task board with cards, labels, checklists, due dates, members, comments, an append-only activity log, search with saved filters, rule-based automation, plan quotas, and board, table, and calendar views.

The specification package this app implements is archived in [`.spec/`](./.spec/).

## Stack

React 19, Vite 8, TypeScript 5.9 in strict mode, Tailwind CSS 4 on `@uix/tokens` design tokens, React Router 8, Vitest 5 with Testing Library.

## Run

```bash
pnpm --filter column-task-board dev
pnpm --filter column-task-board test
pnpm --filter column-task-board typecheck
```

## Architecture

| Layer | Location | Responsibility |
| ----- | -------- | -------------- |
| Domain | `src/domain/` | Entities, card state machine, position math, quotas, automation rules, filters. Framework-free, fully unit tested. |
| Data | `src/data/` | Local-first store with persistence and activity recording; typed API client with the offline mutation queue from the specification. |
| Features | `src/features/` | Boards list, board surface with board, table, and calendar views, card detail, filter bar, rules panel, activity feed. |
| Shared | `src/shared/` | UI primitives styled exclusively with design tokens. |

## Behavior notes

- The store applies every domain rule locally and persists to the browser. When `VITE_API_BASE_URL` is set, every mutation is also queued and synced to the contract API with retry and backoff.
- Automation rules run on card moves, label additions, checklist completion, and due dates, capped by the monthly rule quota with a single notice per month.
- The free plan quotas are enforced in the domain layer: 10 boards, 10 collaborators, 250 rule runs per month.
- Keyboard operation: focus a card, arrow keys move it within and across columns, Enter opens the card detail. Moves are announced through a live region.
- Guest access and multi-user sessions require the API mode; the local mode runs a single member.

## Requirement coverage

| Requirement | Where |
| ----------- | ----- |
| FR-001 boards and columns | `data/store.ts`, `features/boards`, column panel in `features/board/BoardView.tsx` |
| FR-002 card management | `data/store.ts`, `BoardView`, `CardOverlay` |
| FR-003 labels | `domain/types.ts`, `CardOverlay` labels section |
| FR-004 due dates | `domain/card-state.ts`, `CardOverlay` due field |
| FR-005 checklists | `domain/card-state.ts` progress, `CardOverlay` checklists |
| FR-006 members | `data/store.ts`, `CardOverlay` members section |
| FR-007 search and filters | `domain/rules.ts` `matchesFilter`, `FilterBar` |
| FR-008 activity log | `data/store.ts` `record`, `ActivityFeed` |
| FR-009 automation rules | `domain/rules.ts`, `store.dispatchEvents`, `RulesPanel` |
| FR-010 comments | `data/store.ts`, `CardOverlay` comments |
| FR-011 plan quotas | `domain/quotas.ts`, enforced in `store` mutations |
| FR-012 guests | API mode (see Behavior notes) |
| FR-013 views | `BoardView`, `TableView`, `CalendarView` |
