/**
 * Automated Test Plan Runner for Prompt+ Architect AI Extension
 * Tests Tokenizer, Adapters, Context Runway Analyzer & State Handlers
 */
const fs = require("fs");
const path = require("path");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log("\n==================================================");
console.log("   PROMPT+ ARCHITECT AI - EXTENSION TEST PLAN     ");
console.log("==================================================\n");

// -------------------------------------------------------------------
// TEST SUITE 1: Tokenizer & Conversation Analyzer
// -------------------------------------------------------------------
console.log("TEST SUITE 1: Tokenizer & Conversation Analyzer");
const tokenizerPath = path.join(__dirname, "lib", "tokenizer.js");
const tokenizerCode = fs.readFileSync(tokenizerPath, "utf8");

// Mock environment for tokenizer
const mockGlobal = {};
const tokenizerModule = {};
const runTokenizer = new Function("global", "module", "exports", tokenizerCode);
runTokenizer(mockGlobal, tokenizerModule, tokenizerModule.exports = {});
const Tokenizer = tokenizerModule.exports || mockGlobal.PromptPlusTokenizer;

assert(typeof Tokenizer.countTokens === "function", "countTokens function exists");
assert(typeof Tokenizer.analyzeConversation === "function", "analyzeConversation function exists");

// Test token counting
const sampleText = "Build a robust enterprise Next.js authentication system with JWT and rate limiting.";
const tokenCount = Tokenizer.countTokens(sampleText);
assert(tokenCount > 10 && tokenCount <= 30, `Accurate token count estimation (Got: ${tokenCount})`);

// Test empty conversation analysis
const emptyAnalysis = Tokenizer.analyzeConversation([], 128000, "chatgpt");
assert(emptyAnalysis.totalTokens === 0, "Empty conversation totalTokens is 0");
assert(emptyAnalysis.tokensRemaining === 128000, "Empty conversation tokensRemaining equals limit");
assert(emptyAnalysis.percentUsed === 0, "Empty conversation percentUsed is 0");
assert(emptyAnalysis.burnRate === "steady", "Empty conversation burnRate is steady");
assert(emptyAnalysis.turnCount === 0, "Empty conversation turnCount is 0");

// Test multi-turn conversation analysis
const mockTurns = [
  { role: "user", text: "How do I implement rate limiting in Next.js 15?" },
  { role: "assistant", text: "To implement rate limiting in Next.js 15, you can use Upstash Redis with the sliding window algorithm. Here is a production-ready example with edge middleware and defensive fallbacks..." },
  { role: "user", text: "Add unit tests using Vitest." },
  { role: "assistant", text: "Here are comprehensive Vitest unit tests covering IP extraction, Redis timeout handling, and 429 status code responses..." }
];
const turnAnalysis = Tokenizer.analyzeConversation(mockTurns, 128000, "chatgpt");
assert(turnAnalysis.turnCount === 4, "Detected 4 conversation turns");
assert(turnAnalysis.userTokens > 0, `Computed user role tokens (${turnAnalysis.userTokens})`);
assert(turnAnalysis.aiTokens > turnAnalysis.userTokens, `AI output tokens greater than user input (${turnAnalysis.aiTokens} vs ${turnAnalysis.userTokens})`);
assert(turnAnalysis.totalTokens === turnAnalysis.userTokens + turnAnalysis.aiTokens, "Total tokens matches sum of user and AI tokens");
assert(turnAnalysis.tokensRemaining === 128000 - turnAnalysis.totalTokens, "Tokens remaining calculated correctly");
assert(turnAnalysis.estimatedMessagesLeft > 0, `Estimated exchanges left calculated (${turnAnalysis.estimatedMessagesLeft})`);

// Test heavy burn rate classification
const largeTurns = [];
for (let i = 0; i < 20; i++) {
  largeTurns.push({ role: "user", text: "Analyze this 2000-line code snippet:\n" + "const x = 1;\n".repeat(400) });
  largeTurns.push({ role: "assistant", text: "Here is the comprehensive refactoring:\n" + "function optimize() { return true; }\n".repeat(600) });
}
const heavyAnalysis = Tokenizer.analyzeConversation(largeTurns, 128000, "chatgpt");
assert(heavyAnalysis.burnRate === "heavy", `Correctly identified heavy burn rate (Got: ${heavyAnalysis.burnRate})`);
assert(heavyAnalysis.percentUsed > 0, `Percent used computed for heavy turns (${heavyAnalysis.percentUsed}%)`);

// -------------------------------------------------------------------
// TEST SUITE 2: Platform Adapters (ChatGPT, Claude, Gemini, etc.)
// -------------------------------------------------------------------
console.log("\nTEST SUITE 2: Platform Adapters Contract & Resilience");

const adapterFiles = [
  { file: "chatgpt.js", key: "PromptPlusChatGPTAdapter", name: "chatgpt" },
  { file: "claude.js", key: "PromptPlusClaudeAdapter", name: "claude" },
  { file: "gemini.js", key: "PromptPlusGeminiAdapter", name: "gemini" },
  { file: "deepseek.js", key: "PromptPlusDeepSeekAdapter", name: "deepseek" },
  { file: "grok.js", key: "PromptPlusGrokAdapter", name: "grok" },
  { file: "perplexity.js", key: "PromptPlusPerplexityAdapter", name: "perplexity" },
];

// Mock browser DOM environment
global.window = { location: { hostname: "chatgpt.com" } };
global.document = {
  querySelector: () => null,
  querySelectorAll: () => []
};

for (const item of adapterFiles) {
  const filePath = path.join(__dirname, "adapters", item.file);
  const code = fs.readFileSync(filePath, "utf8");
  const mod = {};
  const runAdapter = new Function("global", "module", "exports", code);
  runAdapter(global.window, mod, mod.exports = {});
  const adapter = mod.exports || global.window[item.key];

  assert(adapter != null, `Adapter ${item.file} instantiated`);
  assert(adapter.name === item.name, `Adapter ${item.file} name matches "${item.name}"`);
  assert(typeof adapter.detect === "function", `Adapter ${item.file} implements detect()`);
  assert(typeof adapter.getPromptInput === "function", `Adapter ${item.file} implements getPromptInput()`);
  assert(typeof adapter.insertPrompt === "function", `Adapter ${item.file} implements insertPrompt()`);
  assert(typeof adapter.getActiveModel === "function", `Adapter ${item.file} implements getActiveModel()`);
  assert(typeof adapter.getConversationTurns === "function", `Adapter ${item.file} implements getConversationTurns()`);

  // Verify graceful handling with null/empty DOM
  const fallbackModel = adapter.getActiveModel();
  assert(fallbackModel != null && fallbackModel.limit > 0, `Adapter ${item.file} returns valid fallback model: ${fallbackModel.name} (${fallbackModel.limit} tok)`);
  const turns = adapter.getConversationTurns();
  assert(Array.isArray(turns), `Adapter ${item.file} returns array for turns on empty DOM`);
}

// -------------------------------------------------------------------
// TEST SUITE 3: Manifest & Content Script Integration
// -------------------------------------------------------------------
console.log("\nTEST SUITE 3: Manifest & In-Page Widget Integration");

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
assert(/^\d+\.\d+\.\d+$/.test(manifest.version), "Manifest has a valid release version");
assert(!manifest.permissions.includes("notifications"), "Unverified capacity does not request notifications permission");
assert(manifest.permissions.includes("storage"), "Manifest has storage permission");
// The side panel is the longer workspace: the manifest declares the page and the permission.
assert(manifest.side_panel && manifest.side_panel.default_path === "sidepanel.html", "Manifest points the side panel at sidepanel.html");
assert(manifest.permissions.includes("sidePanel"), "Manifest has the sidePanel permission");

const contentScriptEntry = manifest.content_scripts[0];
assert(contentScriptEntry.js.includes("content.js"), "content.js is present in content_scripts");
assert(contentScriptEntry.js.includes("lib/tokenizer.js"), "tokenizer.js is loaded before content.js");
// One diff renderer, shared by the in-page review panel and the popup review step.
assert(contentScriptEntry.js.includes("lib/diff.js"), "diff.js is loaded in the content script");
assert(contentScriptEntry.js.indexOf("lib/diff.js") < contentScriptEntry.js.indexOf("content.js"), "diff.js loads before content.js");

// Check content.js for unified dock markup & absence of duplicate overlay calls
const contentCode = fs.readFileSync(path.join(__dirname, "content.js"), "utf8");
assert(contentCode.includes("pp-unified-dock"), "content.js creates .pp-unified-dock");
assert(contentCode.includes("pp-dock-enhance"), "content.js has #pp-dock-enhance");
assert(contentCode.includes("pp-dock-runway"), "content.js has #pp-dock-runway");
assert(contentCode.includes("pp-runway-dot"), "content.js has #pp-runway-dot");
assert(contentCode.includes("pp-dock-tones"), "content.js has #pp-dock-tones quick tone buttons");
assert(contentCode.includes("pp-dock-studio-btn"), "content.js has #pp-dock-studio-btn");
assert(!contentCode.includes("window.PromptPlusRunwayOverlay.init()"), "content.js does NOT call obsolete PromptPlusRunwayOverlay.init()");
assert(!contentCode.includes("window.PromptPlusRunwayOverlay.update("), "content.js does NOT call obsolete PromptPlusRunwayOverlay.update()");

// The enhancement preview must not steal Tab, must offer Undo, and is deliberately non-modal.
assert(!contentCode.includes('event.key === "Tab"'), "content.js does not hijack Tab in the enhancement preview");
assert(contentCode.includes("pp-preview-undo"), "content.js offers an Undo action for applied enhancements");
assert(!contentCode.includes('"aria-modal"'), "content.js keeps the enhancement preview non-modal (no aria-modal)");

// -------------------------------------------------------------------
// TEST SUITE 4: Popup Dimensions & Layout Ergonomics
// -------------------------------------------------------------------
console.log("\nTEST SUITE 4: Popup Dimensions & Layout Ergonomics");

const popupHtml = fs.readFileSync(path.join(__dirname, "popup.html"), "utf8");
assert(popupHtml.includes("width: 410px;"), "Popup body width standardized to 410px");
assert(popupHtml.includes("height: 560px;"), "Popup body height standardized to 560px (within Chrome 600px ceiling)");
assert(popupHtml.includes("max-height: 560px;"), "Popup body max-height set to 560px");
assert(popupHtml.includes("height: 86px;"), "Input textarea height optimized to 86px for instant fit");
assert(popupHtml.includes("context-runway-card"), "Popup has context-runway-card");
assert(popupHtml.includes("runway-ring-fg"), "Popup has circular progress ring");

const popupJs = fs.readFileSync(path.join(__dirname, "popup.js"), "utf8");
assert(popupJs.includes("applyLiveTokenState"), "popup.js implements applyLiveTokenState");
assert(popupJs.includes("getTokenState"), "popup.js fetches token state on open");
assert(popupJs.includes("tokenUpdate"), "popup.js listens for live tab token updates");
// The side panel keeps the popup and the Studio as alternatives, and reuses the
// same local synthesizer, enhance endpoint and brand stylesheet.
assert(popupJs.includes("chrome.sidePanel"), "popup.js feature-detects the side panel API before showing the control");
const sidepanelHtml = fs.readFileSync(path.join(__dirname, "sidepanel.html"), "utf8");
const sidepanelJs = fs.readFileSync(path.join(__dirname, "sidepanel.js"), "utf8");
assert(sidepanelHtml.includes('href="design-tokens.css"'), "Panel links the shared design tokens");
assert(sidepanelHtml.includes('class="dark"'), "Panel uses the dark brand surfaces like the popup");
assert(sidepanelHtml.includes("Enhance prompt"), "Panel uses the fixed action label");
assert(sidepanelJs.includes("PromptPlusSynthesis.synthesizeLocalPrompt"), "Panel reuses the local prompt synthesizer");
assert(sidepanelJs.includes('action: "enhancePrompt"'), "Panel reuses the popup enhance endpoint");
assert(sidepanelJs.includes("openInWebStudio"), "Panel keeps a route into the web Studio");

// -------------------------------------------------------------------
// TEST SUITE 5: Message Routing & Robust Text Injection
// -------------------------------------------------------------------
console.log("\nTEST SUITE 5: Message Routing & Robust Text Injection");

assert(contentCode.includes("chrome.runtime.onMessage.addListener"), "content.js registers chrome.runtime.onMessage listener");
assert(contentCode.includes("request.action === \"injectEnhanced\""), "content.js handles injectEnhanced action");
assert(contentCode.includes("request.action === \"enhanceSelection\""), "content.js handles enhanceSelection action");
assert(contentCode.includes("request.action === \"openEnhancePanel\""), "content.js handles openEnhancePanel action");
assert(contentCode.includes("Object.getOwnPropertyDescriptor(proto, \"value\")") || contentCode.includes("getOwnPropertyDescriptor"), "content.js uses native descriptor setter for React 18/19 input/textarea");

const chatgptCode = fs.readFileSync(path.join(__dirname, "adapters", "chatgpt.js"), "utf8");
assert(chatgptCode.includes("getOwnPropertyDescriptor"), "chatgpt.js uses native prototype descriptor setter for React state sync");

const deepseekCode = fs.readFileSync(path.join(__dirname, "adapters", "deepseek.js"), "utf8");
assert(deepseekCode.includes("getOwnPropertyDescriptor"), "deepseek.js uses native prototype descriptor setter for React state sync");

const grokCode = fs.readFileSync(path.join(__dirname, "adapters", "grok.js"), "utf8");
assert(grokCode.includes("getOwnPropertyDescriptor"), "grok.js uses native prototype descriptor setter for React state sync");

const perplexityCode = fs.readFileSync(path.join(__dirname, "adapters", "perplexity.js"), "utf8");
assert(perplexityCode.includes("getOwnPropertyDescriptor"), "perplexity.js uses native prototype descriptor setter for React state sync");

assert(contentCode.includes("isCmdEnter"), "content.js implements in-chat Cmd+Enter / Ctrl+Enter compilation shortcut");
assert(popupJs.includes("if (panelResult) panelResult.style.display = \"none\";"), "popup.js cleans up panelResult on tab switching");
assert(popupJs.includes(".tone-pill-btn"), "popup.js queries .tone-pill-btn selector for tone switching");
assert(popupJs.includes("advanced-tools-toggle"), "popup.js hooks up expandable advanced tools toggle");
assert(popupJs.includes("copyResultToClipboard") && popupJs.includes("navigator.clipboard.writeText(enhancedResult)"), "popup.js implements clipboard fallback on tab injection edge cases");

// The connection label has exactly one owner: the health probe. Two writers
// drifting apart is how every signed-out user came to be told "Offline".
assert((popupJs.match(/syncStatusText\.textContent\s*=/g) || []).length === 1, "popup.js writes the connection label in exactly one place");
assert(!/if \(authData\?\.authenticated[^]*?syncStatusText/.test(popupJs), "popup.js does not let the auth-sync result override the connection label");

const backgroundJs = fs.readFileSync(path.join(__dirname, "background.js"), "utf8");
assert(backgroundJs.includes('cachedHealthState.status === "unknown" ? await pingServerHealth()'), "background.js probes before answering getHealthStatus on a cold worker");

// -------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------
console.log("\n==================================================");
console.log(`TOTAL TESTS:  ${totalTests}`);
console.log(`PASSED TESTS: ${passedTests}`);
console.log(`FAILED TESTS: ${failedTests}`);
console.log("==================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("All structural checks passed. Run browser regressions and the live-site release checklist separately.\n");
  process.exit(0);
}
