const BASE_URL: string | null = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? null;
const QUEUE_KEY = "column-task-board:sync-queue:v1";

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;
  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

export function isApiMode(): boolean {
  return BASE_URL !== null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

function idempotencyKey(): string {
  return crypto.randomUUID();
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey(),
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch(`${BASE_URL}${path}`, init);
  if (response.status === 204) return undefined as T;
  const data = (await response.json()) as T | ApiErrorBody;
  if (!response.ok) {
    const error = data as ApiErrorBody;
    throw new ApiError(response.status, {
      code: error.code ?? "unknown",
      message: error.message ?? `request failed: ${response.status}`,
      details: error.details ?? [],
    });
  }
  return data as T;
}

interface QueueItem {
  id: string;
  method: string;
  path: string;
  body?: unknown;
  attempts: number;
}

function readQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as QueueItem[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    return;
  }
}

export function enqueue(method: string, path: string, body?: unknown): void {
  if (!isApiMode()) return;
  writeQueue([...readQueue(), { id: crypto.randomUUID(), method, path, body, attempts: 0 }]);
}

let flushing = false;

export async function flushQueue(): Promise<number> {
  if (!isApiMode() || flushing) return 0;
  flushing = true;
  let remaining = 0;
  try {
    let queue = readQueue();
    const keep: QueueItem[] = [];
    for (const item of queue) {
      try {
        await request(item.method, item.path, item.body);
      } catch {
        keep.push({ ...item, attempts: item.attempts + 1 });
      }
    }
    queue = keep.filter((i) => i.attempts < 5);
    remaining = queue.length;
    writeQueue(queue);
  } finally {
    flushing = false;
  }
  return remaining;
}

export const api = {
  listBoards: () => request<Page<unknown>>("GET", "/boards"),
  createBoard: (body: { title: string; visibility: string }) =>
    request<unknown>("POST", "/boards", body),
  getBoard: (boardId: string) => request<unknown>("GET", `/boards/${boardId}`),
  listCards: (boardId: string, cursor?: string) =>
    request<Page<unknown>>("GET", `/boards/${boardId}/cards${cursor ? `?cursor=${cursor}` : ""}`),
  moveCard: (cardId: string, body: { columnId: string; position: number }) =>
    request<unknown>("POST", `/cards/${cardId}/move`, body),
  archiveCard: (cardId: string) => request<unknown>("POST", `/cards/${cardId}/archive`, {}),
  restoreCard: (cardId: string) => request<unknown>("POST", `/cards/${cardId}/restore`, {}),
  listActivity: (boardId: string, cursor?: string) =>
    request<Page<unknown>>(
      "GET",
      `/boards/${boardId}/activity${cursor ? `?cursor=${cursor}` : ""}`,
    ),
};
