import { useMemo } from "react";
import { useStore } from "../../App";
import type { Id } from "../../domain/types";
import { EmptyState, SidePanel } from "../../shared/ui";
import { strings } from "../../i18n/strings";

export function ActivityFeed({ boardId, onClose }: { boardId: Id; onClose: () => void }) {
  const activity = useStore((s) => s.activity);
  const members = useStore((s) => s.members);
  const entries = useMemo(() => activity.filter((a) => a.boardId === boardId), [activity, boardId]);

  return (
    <SidePanel title={strings.activity} onClose={onClose}>
      {entries.length === 0 ? (
        <EmptyState>{strings.noActivity}</EmptyState>
      ) : (
        <ol className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id} className="border-b border-border-default pb-3 text-sm">
              <p className="text-text-primary">
                <span className="font-medium">
                  {members.find((m) => m.id === entry.actorId)?.name ?? entry.actorId}
                </span>{" "}
                <span className="text-text-secondary">{entry.action.replace(/-/g, " ")}</span>
              </p>
              <p className="text-text-secondary">{entry.detail}</p>
              <p className="text-xs text-text-muted">{new Date(entry.at).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      )}
    </SidePanel>
  );
}
