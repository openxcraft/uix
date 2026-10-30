# apps

One workspace per application. Each application implements one specification package and registers itself here.

| App | Specification | Status |
| --- | ------------- | ------ |
| [column-task-board](./column-task-board/) | SPEC-000010001 | active |

## Rules

1. Applications are created by `tooling/spec-intake.mjs`, never by hand.
2. Domain logic mirrors the specification's model and rules exactly.
3. Applications depend on `packages/`; the reverse is a defect.
4. An application ships complete: all specified views, states, and tests, or it is not merged.
