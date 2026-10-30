# @uix/config — Shared Baselines

Shared TypeScript presets consumed via workspace protocol:

```jsonc
// packages/*/tsconfig.json
{ "extends": "@uix/config/tsconfig/base.json" }

// browser apps / component packages
{ "extends": "@uix/config/tsconfig/web.json" }
```

## What base.json enforces

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — the compiler is the first reviewer
- `verbatimModuleSyntax` + `isolatedModules` — bundler-safe, tree-shakeable output
- ES2022 target — Node >= 24 and evergreen browsers

## Adding a preset

Add presets only for *recurring platform shapes* (web, native, node-server). One-off flags belong in the consuming package. Update the `exports` map and this README in the same commit.
