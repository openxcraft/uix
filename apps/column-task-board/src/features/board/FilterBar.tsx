import { useMemo, useState } from "react";
import { useStore } from "../../App";
import { store } from "../../data/store";
import type { FilterCriteria, Id } from "../../domain/types";
import { Button, Input, Select } from "../../shared/ui";
import { strings } from "../../i18n/strings";

export function FilterBar({
  boardId,
  criteria,
  onChange,
}: {
  boardId: Id;
  criteria: FilterCriteria;
  onChange: (criteria: FilterCriteria) => void;
}) {
  const labels = useStore((s) => s.labels);
  const members = useStore((s) => s.members);
  const savedFilters = useStore((s) => s.savedFilters);
  const boardLabels = useMemo(() => labels.filter((l) => l.boardId === boardId), [labels, boardId]);
  const boardFilters = useMemo(
    () => savedFilters.filter((f) => f.boardId === boardId),
    [savedFilters, boardId],
  );
  const [filterName, setFilterName] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-default p-3">
      <Input
        type="search"
        value={criteria.q ?? ""}
        onChange={(e) => onChange({ ...criteria, q: e.target.value })}
        placeholder={strings.search}
        aria-label={strings.search}
        className="w-56"
      />
      <Select
        value={criteria.labelIds?.[0] ?? ""}
        onChange={(e) =>
          onChange({ ...criteria, labelIds: e.target.value === "" ? undefined : [e.target.value] })
        }
        aria-label={strings.filterByLabel}
      >
        <option value="">{strings.filterByLabel}</option>
        {boardLabels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Select>
      <Select
        value={criteria.memberId ?? ""}
        onChange={(e) =>
          onChange({ ...criteria, memberId: e.target.value === "" ? undefined : e.target.value })
        }
        aria-label={strings.filterByMember}
      >
        <option value="">{strings.filterByMember}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </Select>
      <Select
        value={criteria.due ?? ""}
        onChange={(e) =>
          onChange({
            ...criteria,
            due: e.target.value === "" ? undefined : (e.target.value as FilterCriteria["due"]),
          })
        }
        aria-label={strings.filterByDue}
      >
        <option value="">{strings.filterByDue}</option>
        <option value="overdue">{strings.overdue}</option>
        <option value="today">{strings.today}</option>
        <option value="week">{strings.week}</option>
        <option value="none">{strings.noDue}</option>
      </Select>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (filterName.trim() === "") return;
          store.saveFilter(boardId, filterName.trim(), criteria);
          setFilterName("");
        }}
      >
        <Input
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder={strings.filterName}
          aria-label={strings.filterName}
          className="w-36"
        />
        <Button type="submit">{strings.saveFilter}</Button>
      </form>

      {boardFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{strings.savedFilters}:</span>
          {boardFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.criteria)}
              className="min-h-11 rounded-full bg-secondary px-3 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      <Button className="ms-auto" onClick={() => onChange({})}>
        {strings.clearFilters}
      </Button>
    </div>
  );
}
