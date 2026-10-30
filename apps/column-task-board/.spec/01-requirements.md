---
id: SPEC-000010001-S1
type: spec-part
status: published
version: 1.0.0
depends_on: [SPEC-000010001]
last_reviewed: 2026-10-30
owner_role: spec-author
---

# Requirements

## Functional

### FR-001 Board management
- Given an owner, when creating a board, then the board has a title, a visibility setting (private or workspace), and three default columns.
- Given an owner, when renaming, adding, reordering, or archiving a column, then the change is visible to all members within 2 seconds.
- Given plan quotas, when the board count reaches the quota, then board creation is refused with the quota limit stated.

### FR-002 Card management
- Given a member, when creating a card in a column, then the card requires a title of 1 to 16384 characters.
- Given a member, when moving a card within or between columns by pointer or keyboard, then the position updates optimistically and survives reload.
- Given a member, when archiving a card, then the card leaves the board view and remains recoverable; when deleting, then the card is recoverable for 30 days.

### FR-003 Labels
- Given an owner, when defining labels, then each label has a name of at most 32 characters and one of 10 fixed colors.
- Given a member, when assigning labels to a card, then the card carries 0 to N labels and filters by label return it.

### FR-004 Due dates
- Given a member, when setting a due date, then an optional reminder offset of 5 minutes to 7 days before is selectable.
- Given the current time, when a due date passes, then the card is marked overdue and filters by due state return it.

### FR-005 Checklists
- Given a member, when adding a checklist to a card, then items are ordered, each item optionally carries one assignee and one due date.
- Given checklist items, when an item is checked, then the card shows completion percentage computed from checked items.

### FR-006 Members
- Given an owner, when adding members up to the plan quota, then members gain board access within their role.
- Given a member, when assigned to a card, then the member filter returns the card.

### FR-007 Search and filters
- Given a query, when searching cards by title, then results return within 1 second for boards of up to 500 cards.
- Given filter criteria of label, member, or due state, when applying them, then only matching cards render and the filter can be saved with a name.

### FR-008 Activity log
- Given any board or card change, when it completes, then an immutable activity entry records actor, action, and timestamp with unlimited retention.

### FR-009 Automation rules
- Given an owner, when composing a rule as one trigger and one to three actions, then valid triggers are: card moved to column, due date reached, label added, checklist completed.
- Given a rule trigger, when it fires, then actions apply within 5 seconds; valid actions are: move card, set or clear due date, add or remove label, archive card, mark complete.
- Given a plan, when rule runs exceed the monthly quota, then further runs are skipped and the owner is notified once per day.

### FR-010 Comments
- Given a member, when commenting on a card, then the comment is visible to all board members and to the activity log.

### FR-011 Plan quotas
- Given the free plan, when observing limits, then: 10 boards per workspace, 10 collaborators, 10 MB per attachment, automation quota 250 rule runs per month.
- Given paid plans, when observing limits, then: unlimited boards and collaborators, 250 MB per attachment, unlimited rule runs, board guests, table, calendar, and dashboard views.

### FR-012 Guests
- Given an owner on a paid plan, when inviting a single-board guest, then the guest accesses exactly one board.

### FR-013 Views
- Given a board, when switching views, then board, table, and calendar views render the same card data; table view supports inline card creation and editing; calendar view places cards on due dates.

## Non-functional

| ID | Requirement | Measure |
|---|---|---|
| NFR-001 | Interactive operations respond locally | Under 200 ms, optimistic |
| NFR-002 | Board load time for 500 cards | Under 2 s on a 10 Mbps connection |
| NFR-003 | Availability | 99.9 percent monthly |
| NFR-004 | Accessibility | WCAG 2.2 AA |
| NFR-005 | Localization and text direction | Locale-aware, full right-to-left |
| NFR-006 | Offline mutation queue | Mutations sync after reconnect, no loss |
| NFR-007 | Audit retention | Unlimited activity history |
| NFR-008 | Search latency | Under 1 s at 500 cards |

## Assumptions

| ID | Assumption | Confidence | Verification | Status |
|---|---|---|---|---|
| ASM-001 | Ten fixed label colors are sufficient | medium | implementation review | unverified |
| ASM-002 | Rule quota of 250 runs per month on the free plan | medium | implementation review | unverified |
