---
id: SPEC-000010001-S7
type: spec-part
status: published
version: 1.0.0
depends_on: [SPEC-000010001]
last_reviewed: 2026-10-30
owner_role: spec-author
---

# Test strategy

## Levels

1. Unit: business rules 1 to 8 of the domain model, position resequencing, quota checks, rule evaluation, progress percentage.
2. Integration: contract conformance of every path in 04-contracts.yaml, error bodies, pagination cursors, idempotency.
3. End to end: flows F1 to F6 on a production-like build.
4. Accessibility: keyboard-only move flow F2, focus order, contrast, screen reader labels, WCAG 2.2 AA.
5. Performance: 500-card board load under 2 s, search under 1 s, move interaction under 200 ms.
6. Resilience: offline mutation queue, reconnect sync, conflict midpoint resolution.

## Traceability

| Requirement | Level |
|---|---|
| FR-001 | unit, integration, e2e F1 |
| FR-002 | unit, e2e F2, a11y |
| FR-003 | unit, integration |
| FR-004 | unit, integration |
| FR-005 | unit, integration |
| FR-006 | unit, integration |
| FR-007 | integration, performance |
| FR-008 | integration, resilience |
| FR-009 | unit, integration, e2e F5 |
| FR-010 | integration, e2e F4 |
| FR-011 | unit, integration |
| FR-012 | integration, e2e F6 |
| FR-013 | e2e |
| NFR-001 | performance |
| NFR-002 | performance |
| NFR-004 | a11y |
| NFR-006 | resilience |

## Gates

Merge requires: unit and integration green, no accessibility criticals, performance budgets met on the reference dataset.
