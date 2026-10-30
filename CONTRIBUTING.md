# Contributing

## Commits

Conventional Commits, imperative mood, lowercase scope:

```
feat(board): keyboard card moves with announcements
fix(quotas): board limit off by one
docs(readme): registry entry for the tracker app
```

## Code

- TypeScript strict; no `any` without a written reason in the PR description
- Tokens only for color, spacing, radius, shadow, and motion
- Components under 200 lines; extract on the second duplication
- No comments explaining what code does; rename until it explains itself
- No placeholder strings, no sample data, no dead branches

## Tests

- Domain rules: unit tests for every business rule
- Components: Testing Library, behavior over implementation
- A new feature without tests is not done

## Accessibility

Keyboard paths for every interaction, visible focus, labels on every control, contrast verified in both themes. Accessibility defects are release blockers.

## Process

CI must pass on `main`. Run locally before pushing:

```bash
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm format:check
```
