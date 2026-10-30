#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const readArg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};

const specId = readArg("spec");
const name = readArg("name");
const source = readArg("source");
const repoRoot = new URL("..", import.meta.url).pathname;

if (!specId || !name || !source) {
  console.error(
    "usage: spec-intake.mjs --spec SPEC-XXXXXXXXX --name app-name --source /path/to/catalog",
  );
  process.exit(1);
}
if (!/^SPEC-\d{9}$/.test(specId)) {
  console.error(`invalid spec id: ${specId}`);
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
  console.error(`invalid app name: ${name}`);
  process.exit(1);
}

const digits = specId.slice(5);
const specDir = join(source, "specs", digits.slice(0, 3), digits.slice(3, 6), specId);
if (!existsSync(specDir)) {
  console.error(`spec package not found: ${specDir}`);
  process.exit(1);
}

const required = [
  "spec.yaml",
  "README.md",
  "00-summary.md",
  "01-requirements.md",
  "02-domain-model.md",
  "03-flows.md",
  "04-contracts.yaml",
  "05-security-privacy.md",
  "06-architecture-options.md",
  "07-test-strategy.md",
  "08-plan.yaml",
  "glossary.md",
];
const missing = required.filter((f) => !existsSync(join(specDir, f)));
if (missing.length > 0) {
  console.error(`spec package incomplete, missing: ${missing.join(", ")}`);
  process.exit(1);
}

const manifest = readFileSync(join(specDir, "spec.yaml"), "utf8");
const titleMatch = manifest.match(/^title:\s*(.+)$/m);
const title = titleMatch ? titleMatch[1] : name;
if (!/^status:\s*published\s*$/m.test(manifest)) {
  console.error("spec is not published");
  process.exit(1);
}

const appDir = join(repoRoot, "apps", name);
if (existsSync(appDir)) {
  console.error(`app already exists: apps/${name}`);
  process.exit(1);
}

cpSync(join(repoRoot, "templates", "spa"), appDir, { recursive: true });
rmSync(join(appDir, "src", "App.tsx"));
renameSync(join(appDir, "package.json.tmpl"), join(appDir, "package.json"));

const packageJson = readFileSync(join(appDir, "package.json"), "utf8")
  .replace("__APP_NAME__", name)
  .replace(/}\s*$/, '  "dependencies": {},\n  "devDependencies": {}\n}\n');
writeFileSync(join(appDir, "package.json"), packageJson);

writeFileSync(
  join(appDir, "index.html"),
  readFileSync(join(appDir, "index.html"), "utf8").replace("__APP_TITLE__", title),
);

mkdirSync(join(appDir, ".spec"), { recursive: true });
for (const file of required) {
  cpSync(join(specDir, file), join(appDir, ".spec", file));
}

console.log(`created apps/${name} from ${specId}`);
console.log(`register: | [\`${name}\`](./${name}/) | ${specId} | active |`);
