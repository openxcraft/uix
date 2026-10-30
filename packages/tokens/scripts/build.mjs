import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const SRC = new URL("../src/tokens.json", import.meta.url);
const REF = /\{([^{}]+)\}/g;

export function flattenTokens(node, path = [], out = []) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
      throw new Error(`Invalid token key "${key}" at ${[...path, key].join(".")}`);
    }
    const nextPath = [...path, key];
    if (child && typeof child === "object" && "$value" in child) {
      out.push({
        path: nextPath,
        value: child.$value,
        type: child.$type ?? null,
        description: child.$description ?? null,
      });
    } else if (child && typeof child === "object") {
      flattenTokens(child, nextPath, out);
    } else {
      throw new Error(`Unexpected non-token value at ${nextPath.join(".")}`);
    }
  }
  return out;
}

const isModeValue = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

export function resolveTokens(tokens) {
  const byPath = new Map(tokens.map((t) => [t.path.join("."), t]));
  const resolving = new Set();
  const resolved = new Map();

  function resolveValue(token, mode) {
    if (resolved.has(token) && mode === null) return resolved.get(token);
    if (resolving.has(token)) throw new Error(`Alias cycle detected at ${token.path.join(".")}`);
    resolving.add(token);
    try {
      const raw = mode === null ? token.value : token.value[mode];
      if (raw === undefined)
        throw new Error(`Token ${token.path.join(".")} is missing mode "${mode}"`);
      if (typeof raw === "number") return raw;
      const out = String(raw).replace(REF, (_, ref) => {
        const target = byPath.get(ref);
        if (!target) throw new Error(`Unknown alias "{${ref}}" used by ${token.path.join(".")}`);
        if (isModeValue(target.value)) {
          if (mode === null) {
            throw new Error(
              `Scalar token ${token.path.join(".")} cannot alias mode token {${ref}} — wrap it in a mode value`,
            );
          }
          return String(resolveValue(target, mode));
        }
        return String(resolveValue(target, null));
      });
      if (out.includes("{")) {
        throw new Error(`Unresolved reference remaining in ${token.path.join(".")}: ${out}`);
      }
      return out;
    } finally {
      resolving.delete(token);
    }
  }

  for (const token of tokens) {
    if (isModeValue(token.value)) {
      resolved.set(token, {
        light: String(resolveValue(token, "light")),
        dark: String(resolveValue(token, "dark")),
      });
    } else {
      resolved.set(token, resolveValue(token, null));
    }
  }
  return resolved;
}

export function buildTokens(source) {
  const tokens = flattenTokens(source);
  const resolved = resolveTokens(tokens);
  const name = (t) => `--${t.path.join("-")}`;
  const scalar = tokens.filter((t) => !isModeValue(t.value));
  const modes = tokens.filter((t) => isModeValue(t.value));

  const decl = (t, v) => `  ${name(t)}: ${v};`;
  const rootLines = tokens.map((t) =>
    decl(t, isModeValue(t.value) ? resolved.get(t).light : resolved.get(t)),
  );
  const darkLines = modes.map((t) => decl(t, resolved.get(t).dark));

  const header = (title) => `/* ${title}\n * Generated from src/tokens.json. Do not edit. */\n`;

  const css = [
    header("Design tokens, light default with dark overrides"),
    ":root {",
    ...rootLines,
    "}",
    "",
    "@media (prefers-color-scheme: dark) {",
    '  :root:not([data-theme="light"]) {',
    ...darkLines.map((l) => `  ${l}`),
    "  }",
    "}",
    "",
    '[data-theme="dark"] {',
    ...darkLines,
    "}",
    "",
    "",
  ].join("\n");

  const jsTable = {};
  for (const t of tokens) jsTable[t.path.join(".")] = resolved.get(t);

  const js = [
    "// Generated from src/tokens.json. Do not edit.",
    "export const tokens = Object.freeze(",
    JSON.stringify(jsTable, null, 2),
    ");",
    "",
  ].join("\n");

  const dts = [
    "// Generated from src/tokens.json. Do not edit.",
    "export interface ModeValues {",
    "  readonly light: string;",
    "  readonly dark: string;",
    "}",
    "export declare const tokens: Readonly<Record<string, string | ModeValues>>;",
    "",
  ].join("\n");

  return {
    css,
    js,
    dts,
    stats: { total: tokens.length, scalar: scalar.length, mode: modes.length },
  };
}

function main() {
  const source = JSON.parse(readFileSync(SRC, "utf8"));
  const { css, js, dts, stats } = buildTokens(source);
  const outDir = join(dirname(SRC.pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "dist");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "tokens.css"), css);
  writeFileSync(join(outDir, "tokens.js"), js);
  writeFileSync(join(outDir, "tokens.d.ts"), dts);
  console.log(
    `@uix/tokens: compiled ${stats.total} tokens (${stats.scalar} scalar, ${stats.mode} mode) -> dist/`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
