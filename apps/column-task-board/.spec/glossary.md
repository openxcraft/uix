---
id: SPEC-000010001-S9
type: spec-part
status: published
version: 1.0.0
depends_on: [SPEC-000010001]
last_reviewed: 2026-10-30
owner_role: spec-author
---

# Glossary

| Term | Meaning |
|---|---|
| Workspace | Container of boards, members, and the plan that sets quotas |
| Board | Ordered set of columns holding cards, with visibility private or workspace |
| Column | Ordered list inside a board; archivable |
| Card | Work item: title, description, labels, members, due date, checklists, comments |
| Label | Board-scoped marker with a name and one of ten fixed colors |
| Checklist | Ordered list of items on a card with completion percentage |
| Member | Workspace participant with the member role |
| Guest | Participant with access to exactly one board |
| Owner | Workspace participant with configuration rights |
| Activity log | Append-only record of actor, action, entity, timestamp |
| Rule | One trigger and one to three actions run by the board |
| Quota | Plan-defined limit on boards, collaborators, attachment size, or rule runs |
| Archive | Reversible removal from the active board view |
| Overdue | Card state when the due date has passed without completion |
| Saved filter | Named, reusable set of card filter criteria |
