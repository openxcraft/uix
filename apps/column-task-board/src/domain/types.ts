export type Id = string;

export type Visibility = "private" | "workspace";

export interface Board {
  id: Id;
  title: string;
  visibility: Visibility;
  createdAt: string;
}

export interface Column {
  id: Id;
  boardId: Id;
  title: string;
  position: number;
  archived: boolean;
}

export type CardPhase = "active" | "complete" | "archived" | "deleted";

export interface Card {
  id: Id;
  boardId: Id;
  columnId: Id;
  title: string;
  description: string;
  position: number;
  labelIds: Id[];
  memberIds: Id[];
  dueAt: string | null;
  completed: boolean;
  archived: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: Id;
  boardId: Id;
  name: string;
  color: LabelColorId;
}

export type LabelColorId =
  | "ember"
  | "teal"
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "gray"
  | "ember-deep"
  | "teal-deep"
  | "red-deep";

export interface Member {
  id: Id;
  name: string;
}

export interface Checklist {
  id: Id;
  cardId: Id;
  title: string;
  position: number;
}

export interface ChecklistItem {
  id: Id;
  checklistId: Id;
  text: string;
  done: boolean;
  assigneeId: Id | null;
  dueAt: string | null;
}

export interface Comment {
  id: Id;
  cardId: Id;
  authorId: Id;
  body: string;
  createdAt: string;
}

export type ActivityAction =
  | "board-created"
  | "column-created"
  | "column-renamed"
  | "column-archived"
  | "card-created"
  | "card-updated"
  | "card-moved"
  | "card-completed"
  | "card-archived"
  | "card-restored"
  | "card-deleted"
  | "label-toggled"
  | "member-assigned"
  | "due-set"
  | "checklist-added"
  | "item-toggled"
  | "comment-added"
  | "rule-created"
  | "rule-toggled"
  | "rule-executed"
  | "rule-skipped-quota"
  | "quota-blocked"
  | "filter-saved";

export interface ActivityEntry {
  id: Id;
  boardId: Id | null;
  cardId: Id | null;
  actorId: Id;
  action: ActivityAction;
  detail: string;
  at: string;
}

export type TriggerType =
  "card-moved-to-column" | "due-date-reached" | "label-added" | "checklist-completed";

export interface Trigger {
  type: TriggerType;
  columnId?: Id | undefined;
  labelId?: Id | undefined;
}

export type ActionType =
  | "move-card"
  | "set-due"
  | "clear-due"
  | "add-label"
  | "remove-label"
  | "archive-card"
  | "mark-complete";

export interface RuleAction {
  type: ActionType;
  columnId?: Id | undefined;
  days?: number | undefined;
  labelId?: Id | undefined;
}

export interface Rule {
  id: Id;
  boardId: Id;
  trigger: Trigger;
  actions: RuleAction[];
  enabled: boolean;
}

export interface SavedFilter {
  id: Id;
  boardId: Id;
  name: string;
  criteria: FilterCriteria;
}

export interface FilterCriteria {
  q?: string | undefined;
  labelIds?: Id[] | undefined;
  memberId?: Id | undefined;
  due?: "overdue" | "today" | "week" | "none" | undefined;
}

export interface AppState {
  boards: Board[];
  columns: Column[];
  cards: Card[];
  labels: Label[];
  members: Member[];
  checklists: Checklist[];
  checklistItems: ChecklistItem[];
  comments: Comment[];
  activity: ActivityEntry[];
  rules: Rule[];
  savedFilters: SavedFilter[];
  currentUserId: Id;
  ruleRunMonth: string;
  ruleRuns: number;
  dueEventsFired: string[];
  quotaNoticeMonth: string;
}
