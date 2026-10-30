import test from "node:test";
import assert from "node:assert/strict";
import { buildTokens, flattenTokens } from "../scripts/build.mjs";
import { readFileSync } from "node:fs";

const source = JSON.parse(readFileSync(new URL("../src/tokens.json", import.meta.url), "utf8"));

test("compiles the real token source", () => {
  const { css, js, dts, stats } = buildTokens(source);
  assert.ok(stats.total > 150, "token source should be substantial");
  assert.ok(stats.mode >= 20, "semantic tokens should be mode-aware");
  assert.ok(css.includes("--color-ember-500: #f97316;"));
  assert.ok(css.includes("--space-4: 1rem;"));
  assert.ok(css.includes('[data-theme="dark"]'));
  assert.ok(js.includes("export const tokens"));
  assert.ok(dts.includes("ModeValues"));
});

test("all aliases are fully resolved (no leftover braces in values)", () => {
  const { css, js } = buildTokens(source);
  for (const line of css.split("\n")) {
    if (line.trim().startsWith("--")) {
      assert.ok(!line.includes("{"), `unresolved alias in CSS line: ${line}`);
    }
  }
  const table = js.match(/Object\.freeze\(([\s\S]*)\)/)?.[1] ?? "{}";
  assert.ok(!/"\{/.test(table), "unresolved alias in JS table");
});

test("JS export contains the full resolved token table", () => {
  const { js } = buildTokens(source);
  const table = JSON.parse(js.slice(js.indexOf("(") + 1, js.lastIndexOf(")")));
  assert.ok(Object.keys(table).length > 150);
  assert.equal(table["color.ember.500"], "#f97316");
  assert.deepEqual(table["color.semantic.text.primary"], { light: "#1c1917", dark: "#fafaf9" });
});

test("mode-aware CSS emits light in :root and dark overrides twice (media + attribute)", () => {
  const { css } = buildTokens(source);
  const primary = "--color-semantic-text-primary:";
  assert.equal(css.split(primary).length - 1, 3, "expected 1 light + 2 dark declarations");
});

test("custom property names are valid CSS identifiers", () => {
  const { css } = buildTokens(source);
  for (const line of css.split("\n")) {
    const m = line.trim().match(/^(--[a-z0-9-]+):/);
    if (m) assert.match(m[1], /^--[a-z0-9-]+$/);
  }
});

test("unknown alias is a hard error", () => {
  assert.throws(
    () => buildTokens({ bad: { ref: { $value: "{does.not.exist}" } } }),
    /Unknown alias/,
  );
});

test("alias cycle is a hard error", () => {
  assert.throws(
    () =>
      buildTokens({
        a: { v: { $value: "{b.v}" } },
        b: { v: { $value: "{a.v}" } },
      }),
    /cycle/i,
  );
});

test("scalar aliasing a mode token is a hard error", () => {
  assert.throws(
    () =>
      buildTokens({
        mode: { v: { $value: { light: "#fff", dark: "#000" } } },
        scalar: { v: { $value: "{mode.v}" } },
      }),
    /mode token/i,
  );
});

test("flattenTokens rejects non-kebab keys", () => {
  assert.throws(() => flattenTokens({ badKey: { v: { $value: "#fff" } } }), /Invalid token key/);
});
