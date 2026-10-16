import { describe, expect, it, vi } from "vitest";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const source = readFileSync("extension/background.js", "utf8");
type Listener = (request: Record<string, unknown>, sender: unknown, respond: (value: unknown) => void) => void;
function startWorker(storage: Record<string, unknown>, failWrite = false) {
  let listener: Listener;
  const notify = vi.fn().mockResolvedValue("notification");
  const event = () => ({ addListener: vi.fn() });
  const session = {
    get: vi.fn(async () => structuredClone(storage)),
    set: vi.fn(async (data) => { if (failWrite) throw new Error("storage unavailable"); Object.assign(storage, structuredClone(data)); }),
  };
  const chrome = {
    storage: { session, local: { get: vi.fn(), set: vi.fn() } },
    runtime: { onInstalled: event(), onMessage: { addListener: (cb: Listener) => { listener = cb; } }, sendMessage: vi.fn().mockResolvedValue(null) },
    tabs: { onRemoved: event(), onUpdated: event(), query: vi.fn().mockResolvedValue([{ id: 1, url: "https://chatgpt.com/c/test" }]) },
    contextMenus: { onClicked: event(), create: vi.fn() },
    commands: { onCommand: event() }, notifications: { create: notify },
  };
  vm.runInNewContext(source, { chrome, crypto: webcrypto, URL, TextEncoder, AbortSignal, fetch: vi.fn().mockResolvedValue(new Response("{}", { status: 503 })), setInterval: vi.fn(), console });
  const send = (request: Record<string, unknown>) => new Promise<{ success?: boolean; data?: { conversationTokens: number } }>((resolve) => listener(request, { tab: { id: 1 }, url: "https://chatgpt.com/c/test" }, (value) => resolve(value as { success: boolean })));
  return { send, notify, session, chrome };
}
const update = { action: "tokenUpdate", contextLimitKnown: true, conversationTokens: 95, contextLimit: 100, tokensRemaining: 5, percentUsed: 95, modelName: "Fixture" };

describe("extension service worker state", () => {
  it("hydrates counters across restarts without unverified capacity alerts", async () => {
    const storage = {};
    const first = startWorker(storage);
    await first.send(update);
    expect(first.notify).not.toHaveBeenCalled();
    const next = startWorker(storage);
    expect((await next.send({ action: "getTokenState" })).data?.conversationTokens).toBe(95);
    await next.send(update);
    expect(next.notify).not.toHaveBeenCalled();
  });
  it("reports storage failure and never sends an unpersisted alert", async () => {
    const worker = startWorker({}, true);
    expect((await worker.send(update)).success).toBe(false);
    expect(worker.notify).not.toHaveBeenCalled();
  });
  it("serializes concurrent updates and ignores unverified capacity alerts", async () => {
    const worker = startWorker({});
    await Promise.all([worker.send({ ...update, contextLimitKnown: false }), worker.send({ ...update, contextLimitKnown: false, conversationTokens: 96 })]);
    expect((await worker.send({ action: "getTokenState" })).data?.conversationTokens).toBe(96);
    expect(worker.notify).not.toHaveBeenCalled();
  });
});
