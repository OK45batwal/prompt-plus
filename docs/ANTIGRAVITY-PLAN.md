# Antigravity — IDE Prompt Enhancer

Enhance prompts directly inside VS Code, Cursor, and compatible IDEs.

## What It Does

- **Enhance selected text** — Select text in any file, right-click or hotkey, get an enhanced version inline
- **Works with Cursor AI / Copilot** — Enhances prompts before they go to the AI assistant (insert as comment, then AI sees the improved version)
- **Side panel** — Full prompt-crafting workspace (like the web app, inside the IDE)
- **Reuses Prompt+ backend** — Same `/api/v1/extension/enhance` endpoint
- **Device AI mode** — Chrome's Gemini Nano via CLI, for offline/sensitive work

## Architecture

```
VS Code Extension
├── src/extension.ts         # Activation, commands, context menus
├── src/enhance.ts           # API caller (reuse logic from browser extension background.js)
├── src/panel.ts             # WebView side panel
├── src/device.ts            # Device AI via local LLM CLI (ollama, etc.)
└── src/status.ts            # Status bar indicator
```

## Features — Priority Order

| # | Feature | Effort | Notes |
|---|---------|--------|-------|
| 1 | **Enhance selection** — right-click "Enhance with Antigravity" or `Cmd+Shift+P` | 1 day | Reads selected text, calls API, replaces selection with enhanced version. Undo supported. |
| 2 | **Inline diff** — shows original vs enhanced in diff editor | 1 day | Uses VS Code's built-in diff editor (`vscode.diff`). User accepts or rejects. |
| 3 | **Side panel** — WebView with full prompt builder (model, tone, context blocks) | 2 days | Reuses web app UI patterns. Loads as VS Code webview panel. |
| 4 | **Cursor AI integration** — insert enhanced prompt as a comment before the AI prompt | 1 day | In Cursor: inserts `/* Antigravity-enhanced: ... */` above the selected text. |
| 5 | **Project context** — auto-include file tree, current function, or git diff in enhancement | 2 days | Uses VS Code's workspace API to gather context. |
| 6 | **Device AI (ollama)** — run enhancement locally with no API key | 2 days | Spawns ollama process from node. No dependency on cloud. |
| 7 | **Multi-model** — pick model in status bar dropdown | 1 day | Status bar widget with model picker. |
| 8 | **Token saver** — concise mode toggle | 0.5 day | Same as Chrome extension. |

## Key Decisions

- **No new backend.** Reuses existing `POST /api/v1/extension/enhance`. Extension sends API key directly (BYOK).
- **Node.js runtime** (not webview-bound) — so it can spawn ollama, read files, etc.
- **Publish to VS Code Marketplace + Open VSX** (for Cursor compatibility, Open VSX is the actual registry Cursor uses).
- **Cursor compatibility** out of the box — Cursor accepts VS Code extensions. No separate build needed. Test the "Ask AI" integration path.

## API Flow

```
User selects text → Cmd+Shift+P (or right-click)
  → extension.ts gets selection
  → enhance.ts calls POST /api/v1/extension/enhance { text, apiKey, model }
  → returns { enhanced, provider, model }
  → shows diff (original vs enhanced)
  → user accepts → replaces selection
```

Device AI fallback (no API key):

```
enhance.ts → ollama run gemma3:7b (or llama3.2) with architect prompt
  → returns enhanced text
```

## Files to Touch

- `extension/` — no changes (separate product)
- `src/app/api/v1/extension/enhance/route.ts` — already works, no changes
- `src/lib/llm/` — no changes

## VS Code Specifics

| Concept | Implementation |
|---------|---------------|
| Command | `antigravity.enhanceSelection` — `Cmd+Shift+P`, `Ctrl+Shift+P` |
| Context menu | `editor/context` — shows on text selection |
| Keybinding | `cmd+shift+p` (mac), `ctrl+shift+p` (windows) |
| WebView panel | `vscode.window.createWebviewPanel` — "Antigravity" |
| Status bar | `vscode.window.createStatusBarItem` — model picker + spinner |
| Diff view | `vscode.commands.executeCommand('vscode.diff', ...)` |
| Settings | `antigravity.apiKey`, `antigravity.defaultModel`, `antigravity.tokensaver` |

## Cursor Integration

Cursor 0.45+ supports `cursor.getActivePrompt()` API (preview). The extension can:

1. Intercept the prompt before Cursor AI processes it
2. Enhance it via Antigravity
3. Pass the enhanced version to Cursor AI

Fallback: insert enhanced prompt as a comment above the cursor position, user copy-pastes.

## Skipped (for now)

- GitHub Copilot integration (no public API to intercept prompts)
- JetBrains extension (different API, same logic — build after VS Code)

## Dev Setup

```bash
mkdir -p ide/antigravity-vscode
cd ide/antigravity-vscode
npx yo code
# TypeScript project
npm install @types/vscode
```

Run: `F5` in VS Code → Extension Development Host.

## Verification

1. Select text in a `.txt` or `.md` file → right-click → "Enhance with Antigravity" → sees diff
2. Select text in Cursor → same flow works
3. No API key → falls back to ollama (if installed) or shows setup prompt
4. Side panel opens with `Antigravity: Enhance Prompt` command
