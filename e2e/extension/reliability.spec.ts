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
    await page.keyboard.press("Tab");
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
    await expect(dialog.locator("ins")).toContainText("concise");
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
  });
}
