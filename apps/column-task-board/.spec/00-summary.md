---
id: SPEC-000010001-S0
type: spec-part
status: published
version: 1.0.0
depends_on: [SPEC-000010001]
last_reviewed: 2026-10-30
owner_role: spec-author
---

# Summary

Teams lose shared visibility of work state when status lives in separate documents. A column board solves this by showing every work item as a card that moves through ordered columns, so state and priority are readable at a glance by every member.

## Roles

| Role | Capability |
|---|---|
| Owner | Creates boards, configures columns, labels, rules, quotas, and guest access |
| Member | Creates and edits cards, comments, assigns work, uses filters |
| Guest | Read-write access limited to one board, no workspace-level access |

## In scope

Single-workspace column boards: columns, cards, labels, checklists, due dates, member assignment, comments, activity log, search and filters, rule-based automation, plan quotas, board, table, and calendar views.

## Out of scope

Cross-board portfolio analytics, time tracking, billing, document editing, simultaneous text co-editing, file editing, chat messaging, and mobile-native applications.
