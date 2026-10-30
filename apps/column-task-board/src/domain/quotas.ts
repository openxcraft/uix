export interface PlanQuotas {
  maxBoards: number;
  maxCollaborators: number;
  maxAttachmentMb: number;
  maxRuleRunsPerMonth: number;
}

export const FREE_PLAN: PlanQuotas = {
  maxBoards: 10,
  maxCollaborators: 10,
  maxAttachmentMb: 10,
  maxRuleRunsPerMonth: 250,
};

export class QuotaError extends Error {
  readonly limit: number;
  constructor(limit: number) {
    super(`quota exceeded: limit ${limit}`);
    this.limit = limit;
  }
}

export function assertBoardQuota(boardCount: number, quotas: PlanQuotas): void {
  if (boardCount >= quotas.maxBoards) throw new QuotaError(quotas.maxBoards);
}

export function assertRuleRuns(runs: number, quotas: PlanQuotas): boolean {
  return runs < quotas.maxRuleRunsPerMonth;
}
