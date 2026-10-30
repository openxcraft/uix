# Architecture

## System shape

```
specification package
        │  tooling/spec-intake.mjs
        ▼
┌─ apps/{project} ────────────────────────────────────────────┐
│  domain   entities and business rules from the spec         │
│  data     local-first store, typed contract client          │
│  features view components per capability                    │
│  shared   cross-feature UI primitives                       │
└──────────────┬───────────────────────────────────────────────┘
               │ depends on
┌──────────────▼───────────── packages/ ──────────────────────┐
│  tokens   design decisions as CSS custom properties and TS  │
│  config  TypeScript presets, lint and format baselines      │
└─────────────────────────────────────────────────────────────┘
```

## Specification pipeline

A specification package contains a manifest, requirements with acceptance criteria, a domain model, interface contracts, and a test strategy. The intake tooling validates the package, scaffolds a workspace from `templates/spa`, and records the project in the registry. Implementation order follows the specification's plan: domain rules first, then the contract client, then vertical feature slices.

## Invariants

1. Dependency direction: apps depend on packages; packages never depend on apps.
2. Design tokens are the only source of visual values; themes extend, never redefine.
3. Domain logic is framework-free and fully unit tested.
4. The contract client mirrors the specification contracts exactly, including error shapes and pagination.
5. Every requirement in a specification maps to at least one test.

## Data model per app

Applications are local-first: the store persists in the browser and applies all domain rules, while the typed contract client targets the specification's API when a base URL is configured. Both paths are first-class: the domain layer powers the local store, the contract client powers server sync.

## Scaling

The repository hosts many independent applications. Builds, tests, and lint run per workspace through the task graph; adding an application never modifies another. Shared code is promoted to `packages/` at its second real consumer, never earlier.
