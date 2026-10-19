import { chromium, expect, test, type BrowserContext, type Worker } from "@playwright/test";
import path from "node:path";
import { readFileSync } from "node:fs";
import vm from "node:vm";

type Snapshot = { pp_token_session_v1: { tokens: [number, { conversationTokens: number; conversationId: string }][] } };
let context: BrowserContext;
let worker: Worker;
let extensionId: string;
test.beforeEach(async () => {
  const extensionPath = path.resolve("extension");
  context = await chromium.launchPersistentContext("", { channel: "chromium", headless: true, args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`] });
  await context.route("https://prompt-plus-three.vercel.app/**", (route) => route.fulfill({ status: 503, body: "offline fixture" }));
  worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
  extensionId = new URL(worker.url()).host;
});
test.afterEach(async () => { await context?.close(); });

for (const editor of ["textarea", "contenteditable"]) {
  test(`inserts into ${editor} without submitting, and survives a worker restart`, async () => {
    await context.route("https://chatgpt.com/**", (route) => route.fulfill({ contentType: "text/html", body: `<html><body><main><div data-message-author-role="user">A visible message</div><form onsubmit="event.preventDefault();document.body.dataset.submitted='yes'">${editor === "textarea" ? '<textarea id="prompt-textarea"></textarea>' : '<div id="prompt-textarea" contenteditable="true" role="textbox"></div>'}<button type="submit">Send</button></form></main></body></html>` }));
    const page = await context.newPage();
    await page.goto("https://chatgpt.com/c/fixture-one");
    await expect(page.locator(".pp-unified-dock")).toBeVisible();
    const tabId = await worker.evaluate(`chrome.tabs.query({}).then(tabs => tabs.find(t => t.url.includes('/c/fixture-one')).id)`);
    const result = await worker.evaluate(`chrome.tabs.sendMessage(${tabId}, {action:'injectEnhanced', enhanced:'Preserve this prompt'})`) as { success: boolean };
    expect(result.success).toBe(true);
    await expect(page.getByRole("dialog", { name: "Review enhancement" })).toBeVisible();
    await expect(page.locator("#pp-preview-tokens")).toContainText("Estimated tokens: 0 →");
    // Tab moves focus into the panel normally; it must never apply the change.
    await page.keyboard.press("Tab");
    await expect(page.locator("#pp-preview-accept")).toBeFocused();
    if (editor === "textarea") await expect(page.locator("#prompt-textarea")).toHaveValue("");
    else await expect(page.locator("#prompt-textarea")).toHaveText("");
    await page.locator("#pp-preview-accept").click();
    if (editor === "textarea") await expect(page.locator("#prompt-textarea")).toHaveValue("Preserve this prompt");
    else await expect(page.locator("#prompt-textarea")).toHaveText("Preserve this prompt");
    await expect(page.locator("body")).not.toHaveAttribute("data-submitted", "yes");
    await expect.poll(() => worker.evaluate(`chrome.storage.session.get('pp_token_session_v1').then(x => x.pp_token_session_v1?.tokens.length || 0)`)).toBe(1);
    const snapshot = await worker.evaluate(`chrome.storage.session.get('pp_token_session_v1')`) as Snapshot;
    expect(JSON.stringify(snapshot)).not.toContain("A visible message");
    expect(JSON.stringify(snapshot)).not.toContain("Preserve this prompt");
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    const cdp = await context.newCDPSession(page);
    await cdp.send("ServiceWorker.enable");
    await cdp.send("ServiceWorker.stopAllWorkers");
    // Extension messaging wakes the worker again; persisted counters must survive.
    await popup.evaluate(`chrome.runtime.sendMessage({action:'getHealthStatus'})`);
    const recovered = await popup.evaluate(`chrome.storage.session.get('pp_token_session_v1')`) as Snapshot;
    const before = snapshot.pp_token_session_v1.tokens[0][1];
    const after = recovered.pp_token_session_v1.tokens[0][1];
    expect(after.conversationTokens).toBe(before.conversationTokens);
    expect(after.conversationId).toBe(before.conversationId);
    await popup.evaluate(`chrome.tabs.update(${tabId}, {active: true})`);
    const restored = await popup.evaluate(`chrome.runtime.sendMessage({action:'getTokenState'})`) as { data: { conversationTokens: number } };
    expect(restored.data.conversationTokens).toBe(before.conversationTokens);
    // SPA navigation must discard state belonging to the previous conversation.
    await page.evaluate(() => { history.pushState({}, "", "/c/fixture-two"); window.dispatchEvent(new PopStateEvent("popstate")); });
    await expect.poll(() => popup.evaluate(`chrome.storage.session.get('pp_token_session_v1').then(x => x.pp_token_session_v1.tokens[0]?.[1]?.conversationId ?? null)`)).not.toBe(before.conversationId);
    await page.close();
    await expect.poll(() => popup.evaluate(`chrome.storage.session.get('pp_token_session_v1').then(x => x.pp_token_session_v1.tokens.length)`)).toBe(0);
  });
}

test("keeps the dock under the chat input, with no drag", async () => {
  await context.route("https://chatgpt.com/**", (route) => route.fulfill({ contentType: "text/html", body: `<html><body><main style="height:200px"></main><form><textarea id="prompt-textarea"></textarea><button type="submit">Send</button></form></body></html>` }));
  const page = await context.newPage();
  await page.goto("https://chatgpt.com/c/pinned");
  const dock = page.locator(".pp-unified-dock");
  await expect(dock).toBeVisible();
  const dockBox = (await dock.boundingBox())!;
  const composerBox = (await page.locator("form").boundingBox())!;
  // 8px under the composer's bottom edge, and centred on the composer.
  expect(Math.abs(dockBox.y - (composerBox.y + composerBox.height + 8))).toBeLessThanOrEqual(1);
  expect(Math.abs(dockBox.x + dockBox.width / 2 - (composerBox.x + composerBox.width / 2))).toBeLessThanOrEqual(1);
  // Dragging the pill's own padding (the old drag origin) must not move it now.
  await page.mouse.move(dockBox.x + dockBox.width / 2, dockBox.y + dockBox.height - 2);
  await page.mouse.down();
  await page.mouse.move(dockBox.x + dockBox.width / 2 + 140, dockBox.y - 90, { steps: 5 });
  await page.mouse.up();
  const after = (await dock.boundingBox())!;
  expect(Math.abs(after.x - dockBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.y - dockBox.y)).toBeLessThanOrEqual(1);
  // The composer growing must carry the dock with it, not leave it stranded.
  await page.locator("#prompt-textarea").evaluate((el) => { (el as HTMLElement).style.height = "160px"; });
  await expect.poll(async () => {
    const d = (await dock.boundingBox())!;
    const c = (await page.locator("form").boundingBox())!;
    return Math.round(Math.abs(d.y - (c.y + c.height + 8)));
  }).toBeLessThanOrEqual(1);
});

test("clears the whole composer box, not just the input wrapper", async () => {
  // The shape real hosts use: the editable area sits alone in its own wrapper, with
  // the attachment tray and the toolbar as siblings below it inside the composer.
  await context.route("https://chatgpt.com/**", (route) => route.fulfill({
    contentType: "text/html",
    body: `<html><body><main style="height:120px"></main>
      <div id="composer" style="border-radius:14px; background:#1f1f1f; padding:8px; width:640px; margin-left:8px;">
        <div style="height:64px"><textarea id="prompt-textarea" style="width:100%; height:40px"></textarea></div>
        <div style="height:40px">report.pdf</div>
        <button type="submit">Send</button>
      </div></body></html>`,
  }));
  const page = await context.newPage();
  await page.goto("https://chatgpt.com/c/tray");
  const dock = page.locator(".pp-unified-dock");
  await expect(dock).toBeVisible();
  const dockBox = (await dock.boundingBox())!;
  const composerBox = (await page.locator("#composer").boundingBox())!;
  const inputBox = (await page.locator("#prompt-textarea").boundingBox())!;
  // Anchored to the composer, not to the input's own wrapper...
  expect(Math.abs(dockBox.y - (composerBox.y + composerBox.height + 8))).toBeLessThanOrEqual(1);
  // ...so it never covers the input or the attachment tray.
  expect(dockBox.y).toBeGreaterThanOrEqual(inputBox.y + inputBox.height);
  expect(dockBox.y).toBeGreaterThanOrEqual(composerBox.y + composerBox.height);
});

test("hands a saved chat context from one chatbot to another without submitting", async () => {
  const composer = (editor: string) => editor === "textarea"
    ? `<textarea id="prompt-textarea"></textarea>`
    : `<div id="prompt-textarea" contenteditable="true" role="textbox" style="min-height:40px"></div>`;
  const form = (editor: string) => `<form onsubmit="event.preventDefault();document.body.dataset.submitted='yes'">${composer(editor)}<button type="submit">Send</button></form>`;
  await context.route("https://chatgpt.com/**", (route) => route.fulfill({
    contentType: "text/html",
    body: `<html><body><main><div data-message-author-role="user">Plan my trip to Kyoto</div><div data-message-author-role="assistant">Start with the temples in Higashiyama.</div></main>${form("textarea")}</body></html>`,
  }));
  await context.route("https://claude.ai/**", (route) => route.fulfill({
    contentType: "text/html",
    body: `<html><body><main>${form("contenteditable")}</main></body></html>`,
  }));

  const source = await context.newPage();
  await source.goto("https://chatgpt.com/c/handoff");
  await expect(source.locator(".pp-unified-dock")).toBeVisible();
  await source.locator("#pp-dock-context-btn").click();
  const sourceMenu = source.locator("#pp-dock-menu");
  await expect(sourceMenu).toBeVisible();
  await expect(sourceMenu).toContainText("2 visible messages");
  await source.locator("#pp-ctx-save").click();
  // The menu reports what was stored, and the store holds exactly those turns.
  await expect(sourceMenu).toContainText("Saved: ChatGPT (GPT-4o) · 2 visible messages");
  const stored = await worker.evaluate("chrome.storage.local.get('pp_chat_context_v1').then(r => r.pp_chat_context_v1)") as { turns: { role: string; text: string }[] };
  expect(stored.turns).toHaveLength(2);
  expect(stored.turns[0]).toMatchObject({ role: "user", text: "Plan my trip to Kyoto" });
  expect(stored.turns[1]).toMatchObject({ role: "assistant", text: "Start with the temples in Higashiyama." });

  const target = await context.newPage();
  await target.goto("https://claude.ai/new");
  const input = target.locator("#prompt-textarea");
  await expect(target.locator(".pp-unified-dock")).toBeVisible();
  await target.locator("#pp-dock-context-btn").click();
  const targetMenu = target.locator("#pp-dock-menu");
  await expect(targetMenu).toContainText("no visible messages");
  await expect(targetMenu).toContainText("Saved: ChatGPT (GPT-4o)");
  await target.locator("#pp-ctx-load").click();
  const dialog = target.getByRole("dialog", { name: "Review context transfer" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Saved context from ChatGPT (GPT-4o) · 2 visible messages");
  await expect(dialog.locator("#pp-preview-tokens")).toContainText("Estimated tokens: 0 →");
  // Review first: clicking Load must not touch the composer.
  await expect(input).toHaveText("");
  await dialog.locator("#pp-preview-accept").click();
  await expect(input).toContainText("Plan my trip to Kyoto");
  await expect(input).toContainText("Start with the temples in Higashiyama.");
  await expect(input).toContainText("Text visible in that tab only");
  await expect(target.locator("body")).not.toHaveAttribute("data-submitted", "yes");
  // The insert is reversible. The panel renames itself once applied, so target it by id.
  await target.locator("#pp-enhancement-preview #pp-preview-undo").click();
  await expect(input).toHaveText("");
  await target.close();
  await source.close();
});

test("moves the same chat context from the popup, onto the other chatbot", async () => {
  await context.route("https://chatgpt.com/**", (route) => route.fulfill({
    contentType: "text/html",
    body: `<html><body><main><div data-message-author-role="user">Plan my trip to Kyoto</div><div data-message-author-role="assistant">Start with the temples in Higashiyama.</div></main><form onsubmit="event.preventDefault();document.body.dataset.submitted='yes'"><textarea id="prompt-textarea"></textarea><button type="submit">Send</button></form></body></html>`,
  }));
  await context.route("https://claude.ai/**", (route) => route.fulfill({
    contentType: "text/html",
    body: `<html><body><main><form onsubmit="event.preventDefault();document.body.dataset.submitted='yes'"><div id="prompt-textarea" contenteditable="true" role="textbox" style="min-height:40px"></div><button type="submit">Send</button></form></main></body></html>`,
  }));

  const source = await context.newPage();
  await source.goto("https://chatgpt.com/c/popup-handoff");
  await expect(source.locator(".pp-unified-dock")).toBeVisible();
  const sourceTab = await worker.evaluate(`chrome.tabs.query({}).then(tabs => tabs.find(t => t.url.includes('/c/popup-handoff')).id)`);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.evaluate(`chrome.tabs.update(${sourceTab}, {active: true})`);
  await popup.locator("#tab-btn-context").click();
  await expect(popup.locator("#chat-context-this")).toContainText("2 visible");
  await popup.locator("#chat-context-save-btn").click();
  await expect(popup.locator("#chat-context-saved")).toContainText("2 messages");
  const stored = await worker.evaluate("chrome.storage.local.get('pp_chat_context_v1').then(r => r.pp_chat_context_v1)") as { turns: { role: string; text: string }[]; platformName: string };
  expect(stored.turns).toHaveLength(2);
  expect(stored.turns[0]).toMatchObject({ role: "user", text: "Plan my trip to Kyoto" });
  expect(stored.platformName).toContain("ChatGPT");

  const target = await context.newPage();
  await target.goto("https://claude.ai/new");
  await expect(target.locator(".pp-unified-dock")).toBeVisible();
  const targetTab = await worker.evaluate(`chrome.tabs.query({}).then(tabs => tabs.find(t => t.url.includes('claude.ai/new')).id)`);
  await popup.evaluate(`chrome.tabs.update(${targetTab}, {active: true})`);
  // Re-read the panel: the tab it acts on changed.
  await popup.locator("#tab-btn-enhance").click();
  await popup.locator("#tab-btn-context").click();
  await expect(popup.locator("#chat-context-this")).toContainText("no messages");
  await expect(popup.locator("#chat-context-insert-btn")).toBeEnabled();
  await popup.locator("#chat-context-insert-btn").click();

  const input = target.locator("#prompt-textarea");
  const dialog = target.getByRole("dialog", { name: "Review context transfer" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Saved context from ChatGPT");
  // The popup asks for a review, so nothing reaches the composer until it is applied.
  await expect(input).toHaveText("");
  await dialog.locator("#pp-preview-accept").click();
  await expect(input).toContainText("Plan my trip to Kyoto");
  await expect(input).toContainText("Start with the temples in Higashiyama.");
  await expect(target.locator("body")).not.toHaveAttribute("data-submitted", "yes");
  await target.close();
  await source.close();
});

test("popup compiles locally and copies when insertion is unavailable", async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { document.body.dataset.copied = text; } } });
  });
  await popup.locator("#advanced-tools-toggle").click();
  await popup.locator("#mode-algo").click();
  await popup.locator("#input").fill("Write a concise project update");
  await popup.locator("#enhance-btn").click();
  await expect(popup.locator("#result-body")).not.toHaveText("");
  // The popup tab has no content-script insertion listener: the real messaging call fails.
  await popup.locator("#use-btn").click();
  await expect(popup.locator("body")).toHaveAttribute("data-copied", /project update/i);
  await expect(popup.locator("#use-btn")).toHaveText("Copied to Clipboard!");
  await popup.evaluate(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("denied"); } } }); });
  await popup.locator("#copy-btn").click();
  await expect(popup.getByText("Clipboard unavailable. Select and copy the result manually.")).toBeVisible();
});

for (const editor of ["textarea", "contenteditable"]) {
  test(`reviews engine changes in ${editor}, rejects safely, and prevents stale acceptance`, async () => {
    await context.route("https://chatgpt.com/**", route => route.fulfill({ contentType: "text/html", body: `<html><body><main><form onsubmit="event.preventDefault();document.body.dataset.submitted='yes'">${editor === "textarea" ? '<textarea id="prompt-textarea"></textarea>' : '<div id="prompt-textarea" contenteditable="true" role="textbox"></div>'}<button type="submit">Send</button></form></main></body></html>` }));
    await context.route("https://prompt-plus-three.vercel.app/api/v1/extension/enhance", route => route.fulfill({ json: { enhanced: "Write a concise project update for the team.", provider: "engine", model: "promptplus-engine", source: "engine" } }));
    const page = await context.newPage();
    await page.goto("https://chatgpt.com/c/preview");
    const input = page.locator("#prompt-textarea");
    const read = () => editor === "textarea" ? input.inputValue() : input.innerText();
    await expect(page.locator("#pp-dock-enhance")).toBeVisible();
    await input.fill("Write a project update");
    await page.locator("#pp-dock-enhance").click();
    const dialog = page.getByRole("dialog", { name: "Review enhancement" });
    await expect(dialog).toBeVisible();
    expect(await read()).toBe("Write a project update");
    await expect(dialog).toContainText("Deterministic engine");
    await expect(dialog.locator("ins").first()).toContainText("concise");
    // The original survives verbatim inside the compiled output, so the diff must
    // report additions only — nothing from the input was removed.
    await expect(dialog.locator("del")).toHaveCount(0);
    await expect(dialog.locator('[data-preview="original"]')).toHaveText("Write a project update");
    // The diff carries text labels, so "changed" is not colour-only.
    await expect(dialog.locator("#pp-preview-legend")).toContainText("Removed");
    await expect(dialog.locator("#pp-preview-legend")).toContainText("Added");
    const tokenizerContext = { PromptPlusTokenizer: undefined as undefined | { countTokens: (text: string) => number } };
    vm.runInNewContext(readFileSync("extension/lib/tokenizer.js", "utf8"), tokenizerContext);
    const counts = ["Write a project update", "Write a concise project update for the team."].map(text => tokenizerContext.PromptPlusTokenizer!.countTokens(text));
    await expect(dialog.locator("#pp-preview-tokens")).toHaveText(`Estimated tokens: ${counts[0]} → ${counts[1]} (+${counts[1] - counts[0]})`);
    await page.screenshot({ path: test.info().outputPath(`extension-preview-${editor}.png`) });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    expect(await read()).toBe("Write a project update");
    await page.locator("#pp-dock-enhance").click();
    await expect(dialog).toBeVisible();
    await input.fill("My newer draft");
    await dialog.locator("#pp-preview-accept").click();
    expect(await read()).toBe("My newer draft");
    await expect(dialog).not.toBeVisible();
    await expect(page.locator("body")).not.toHaveAttribute("data-submitted", "yes");
    // Applying is reversible, and Undo is guarded by the same stale-edit check.
    await page.locator("#pp-dock-enhance").click();
    await expect(dialog).toBeVisible();
    await dialog.locator("#pp-preview-accept").click();
    const applied = page.locator("#pp-enhancement-preview");
    await expect(applied.locator("#pp-preview-undo")).toBeVisible();
    await applied.locator("#pp-preview-undo").click();
    expect(await read()).toBe("My newer draft");
    await expect(page.locator("#pp-enhancement-preview")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveAttribute("data-submitted", "yes");
  });
}
