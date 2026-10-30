# uix

Production frontend interfaces built from published specifications. Each specification package becomes a complete application workspace in `apps/`, sharing one design token system and one set of engineering standards.

Specifications are consumed from the clean-room catalog: abstract, name-free, functional packages with requirements, domain models, contracts, and test strategy.

## Project registry

| App | Specification | Stack |
| --- | ------------- | ----- |
| `column-task-board` | SPEC-000010001 · column task board | React · Vite · TypeScript · Tailwind |

## Repository layout

| Path | Purpose |
| ---- | ------- |
| `apps/` | One workspace per application |
| `packages/` | Shared libraries: design tokens, configs, future component and utility packages |
| `templates/` | Scaffold templates used by the intake tooling |
| `tooling/` | Spec intake and workspace generators |
| `docs/` | Repository documentation |

## Workflow

1. A specification package enters the queue.
2. `tooling/spec-intake.mjs` scaffolds an app workspace from the specification.
3. The app implements the specification: requirements trace to code and tests.
4. CI gates every change: build, lint, format, typecheck, tests.

## Quickstart

```bash
corepack enable
pnpm install
pnpm build && pnpm test
pnpm --filter column-task-board dev
```

## Standards

- TypeScript strict mode everywhere, no suppressed errors
- Visual values come exclusively from `@uix/tokens`
- Accessibility to WCAG 2.2 AA: keyboard parity, focus management, contrast
- Responsive from 360 px, dark mode and right-to-left layouts supported
- No placeholder content; applications ship complete or not at all

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).
