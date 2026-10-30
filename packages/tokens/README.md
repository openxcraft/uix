# @uix/tokens

Design decisions as data. The token source is the single origin of every visual value in the repository.

## Format

W3C Design Token Community Group JSON in `src/tokens.json`:

- `$type`, `$value`, `$description` on each leaf
- Aliases as `{color.gray.900}`, resolved at build time; unresolved references and cycles fail the build
- Mode values as objects: `{ "light": "#fff", "dark": "#000" }`

## Build

```bash
pnpm --filter @uix/tokens build
pnpm --filter @uix/tokens test
```

Outputs in `dist/`: `tokens.css` (custom properties, light in `:root`, dark through `prefers-color-scheme` and `data-theme`), `tokens.js`, `tokens.d.ts`.

## Palette

| Scale | Role |
| ----- | ---- |
| `gray` | Warm neutral surfaces, text, borders |
| `ember` | Primary interactive color |
| `teal` | Secondary accent in data contexts |
| `green`, `amber`, `red`, `blue` | Feedback states |

Typography stacks: Inter for interface text, Space Grotesk for display, JetBrains Mono for code. Applications self-host the fonts.

## Consumption

```ts
import "@uix/tokens/css";
```

```css
background: var(--color-semantic-surface-raised);
color: var(--color-semantic-text-primary);
```

Applications extend semantics with project themes; they never redefine the base scales.
