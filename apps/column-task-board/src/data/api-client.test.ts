import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const QUEUE_KEY = "column-task-board:sync-queue:v1";

describe("offline sync queue", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test");
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("reuses a queued mutation's idempotency key after a transient failure", async () => {
    const responses = [
      {
        status: 503,
        ok: false,
        json: async () => ({ code: "unavailable", message: "try again", details: [] }),
      },
      {
        status: 200,
        ok: true,
        json: async () => ({ ok: true }),
      },
    ] as Response[];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => responses.shift()!);
    vi.stubGlobal("fetch", fetchMock);

    const client = await import("./api-client");
    client.enqueue("POST", "/boards", { title: "Retry-safe" });

    const queued = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as { id: string }[];
    expect(queued).toHaveLength(1);

    expect(await client.flushQueue()).toBe(1);
    expect(await client.flushQueue()).toBe(0);

    const keys = fetchMock.mock.calls.map(([, init]) => {
      const headers = init?.headers as Record<string, string>;
      return headers["idempotency-key"];
    });
    expect(keys).toEqual([queued[0]!.id, queued[0]!.id]);
  });
});
