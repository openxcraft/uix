import { useMemo, useState } from "react";
import { useStore } from "../../App";
import { store } from "../../data/store";
import { isValidActions } from "../../domain/rules";
import type { ActionType, Id, RuleAction, TriggerType } from "../../domain/types";
import { Button, Field, Input, Select, SidePanel } from "../../shared/ui";
import { strings } from "../../i18n/strings";

export function RulesPanel({
  boardId,
  onClose,
  runs,
  maxRuns,
}: {
  boardId: Id;
  onClose: () => void;
  runs: number;
  maxRuns: number;
}) {
  const rules = useStore((s) => s.rules);
  const columns = useStore((s) => s.columns);
  const labels = useStore((s) => s.labels);
  const boardRules = useMemo(() => rules.filter((r) => r.boardId === boardId), [rules, boardId]);
  const boardColumns = useMemo(
    () => columns.filter((c) => c.boardId === boardId && !c.archived),
    [columns, boardId],
  );
  const boardLabels = useMemo(() => labels.filter((l) => l.boardId === boardId), [labels, boardId]);

  const [triggerType, setTriggerType] = useState<TriggerType>("card-moved-to-column");
  const [triggerColumnId, setTriggerColumnId] = useState<string>("");
  const [triggerLabelId, setTriggerLabelId] = useState<string>("");
  const [actionTypes, setActionTypes] = useState<ActionType[]>(["mark-complete"]);
  const [actionColumnId, setActionColumnId] = useState<string>("");
  const [actionLabelId, setActionLabelId] = useState<string>("");
  const [actionDays, setActionDays] = useState("1");

  const triggerText = (t: TriggerType): string => {
    switch (t) {
      case "card-moved-to-column":
        return strings.triggerMovedTo;
      case "due-date-reached":
        return strings.triggerDueReached;
      case "label-added":
        return strings.triggerLabelAdded;
      case "checklist-completed":
        return strings.triggerChecklistDone;
    }
  };

  const actionText = (a: RuleAction): string => {
    switch (a.type) {
      case "move-card":
        return `${strings.actionMove} ${boardColumns.find((c) => c.id === a.columnId)?.title ?? ""}`;
      case "set-due":
        return `${strings.actionSetDue} ${a.days ?? 1}`;
      case "clear-due":
        return strings.actionClearDue;
      case "add-label":
        return `${strings.actionAddLabel} ${boardLabels.find((l) => l.id === a.labelId)?.name ?? ""}`;
      case "remove-label":
        return `${strings.actionRemoveLabel} ${boardLabels.find((l) => l.id === a.labelId)?.name ?? ""}`;
      case "archive-card":
        return strings.actionArchive;
      case "mark-complete":
        return strings.actionComplete;
    }
  };

  const submit = () => {
    const trigger =
      triggerType === "card-moved-to-column"
        ? { type: triggerType, columnId: triggerColumnId || boardColumns[0]?.id }
        : triggerType === "label-added"
          ? { type: triggerType, labelId: triggerLabelId || boardLabels[0]?.id }
          : { type: triggerType };
    const actions: RuleAction[] = actionTypes.map((type) => {
      switch (type) {
        case "move-card":
          return { type, columnId: actionColumnId || boardColumns[0]?.id };
        case "set-due":
          return { type, days: Math.max(0, Math.min(365, Number(actionDays) || 1)) };
        case "add-label":
        case "remove-label":
          return { type, labelId: actionLabelId || boardLabels[0]?.id };
        default:
          return { type };
      }
    });
    if (trigger.columnId === undefined && triggerType === "card-moved-to-column") return;
    if (trigger.labelId === undefined && triggerType === "label-added") return;
    if (!isValidActions(actions)) return;
    store.createRule(boardId, trigger, actions);
    setActionTypes(["mark-complete"]);
  };

  return (
    <SidePanel title={strings.rules} onClose={onClose}>
      <p className="mb-4 text-sm text-text-secondary">{strings.ruleRuns(runs, maxRuns)}</p>

      {boardRules.length === 0 && <p className="mb-4 text-sm text-text-muted">{strings.noRules}</p>}
      <ul className="mb-6 flex flex-col gap-2">
        {boardRules.map((rule) => (
          <li key={rule.id} className="rounded-lg border border-border-default p-3 text-sm">
            <p className="text-text-primary">
              <span className="font-medium">{strings.when}</span> {triggerText(rule.trigger.type)}
              {rule.trigger.columnId !== undefined && (
                <span> {boardColumns.find((c) => c.id === rule.trigger.columnId)?.title}</span>
              )}
              {rule.trigger.labelId !== undefined && (
                <span> {boardLabels.find((l) => l.id === rule.trigger.labelId)?.name}</span>
              )}
            </p>
            <ul className="mt-1 list-inside list-disc text-text-secondary">
              {rule.actions.map((a, i) => (
                <li key={i}>{actionText(a)}</li>
              ))}
            </ul>
            <div className="mt-2 flex items-center gap-2">
              <Button onClick={() => store.toggleRule(rule.id)}>
                {rule.enabled ? strings.enabled : strings.disabled}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h3 className="font-medium text-text-primary">{strings.addRule}</h3>
        <Field label={strings.when}>
          <Select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as TriggerType)}
          >
            {(
              [
                "card-moved-to-column",
                "due-date-reached",
                "label-added",
                "checklist-completed",
              ] as TriggerType[]
            ).map((t) => (
              <option key={t} value={t}>
                {triggerText(t)}
              </option>
            ))}
          </Select>
        </Field>
        {triggerType === "card-moved-to-column" && (
          <Field label={strings.columns}>
            <Select value={triggerColumnId} onChange={(e) => setTriggerColumnId(e.target.value)}>
              {boardColumns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {triggerType === "label-added" && (
          <Field label={strings.filterByLabel}>
            <Select value={triggerLabelId} onChange={(e) => setTriggerLabelId(e.target.value)}>
              {boardLabels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {actionTypes.map((type, index) => (
          <div key={index} className="flex items-end gap-2">
            <Field label={index === 0 ? strings.then : strings.addAction}>
              <Select
                value={type}
                onChange={(e) => {
                  const next = [...actionTypes];
                  next[index] = e.target.value as ActionType;
                  setActionTypes(next);
                }}
              >
                {(
                  [
                    "mark-complete",
                    "move-card",
                    "set-due",
                    "clear-due",
                    "add-label",
                    "remove-label",
                    "archive-card",
                  ] as ActionType[]
                ).map((a) => (
                  <option key={a} value={a}>
                    {actionText({ type: a })}
                  </option>
                ))}
              </Select>
            </Field>
            {index > 0 && (
              <Button onClick={() => setActionTypes(actionTypes.filter((_, i) => i !== index))}>
                ×
              </Button>
            )}
          </div>
        ))}
        {actionTypes.length < 3 && (
          <Button
            className="self-start"
            onClick={() => setActionTypes([...actionTypes, "archive-card"])}
          >
            + {strings.addAction}
          </Button>
        )}
        {actionTypes.includes("move-card") && (
          <Field label={strings.actionMove}>
            <Select value={actionColumnId} onChange={(e) => setActionColumnId(e.target.value)}>
              {boardColumns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {actionTypes.includes("set-due") && (
          <Field label={strings.actionSetDue}>
            <Input
              type="number"
              min={0}
              max={365}
              value={actionDays}
              onChange={(e) => setActionDays(e.target.value)}
            />
          </Field>
        )}
        {(actionTypes.includes("add-label") || actionTypes.includes("remove-label")) && (
          <Field label={strings.filterByLabel}>
            <Select value={actionLabelId} onChange={(e) => setActionLabelId(e.target.value)}>
              {boardLabels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Button type="submit" variant="primary" disabled={boardColumns.length === 0}>
          {strings.create}
        </Button>
      </form>
    </SidePanel>
  );
}
