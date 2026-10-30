# packages

Shared libraries for every application. Dependency direction: apps depend on packages, never the reverse.

| Package | Purpose |
| ------- | ------- |
| `@uix/tokens` | Design tokens compiled to CSS custom properties and TypeScript |
| `@uix/config` | Shared TypeScript presets |

Future packages appear at their second real consumer, never earlier: `ui-web` for shared components, `i18n` for translations, `analytics` for the event schema, `test-utils` for shared matchers.

## Rules

1. Every package owns a README, a typed `exports` map, and tests.
2. No stub directories: a package exists when it has real code.
3. Deep imports across package boundaries are forbidden; use the `exports` map.
