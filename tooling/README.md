# tooling

Automation for the specification pipeline.

| Tool | Purpose |
| ---- | ------- |
| `spec-intake.mjs` | Validate a specification package and scaffold an application workspace from `templates/spa` |

## Spec intake

```bash
node tooling/spec-intake.mjs --spec SPEC-000010001 --name column-task-board --source /path/to/catalog
```

Validates the package structure and manifest fields, copies the scaffold, renames the workspace, and prints the registration line for `apps/README.md`.
