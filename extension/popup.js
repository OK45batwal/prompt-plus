/**
 * Prompt+ Architect AI — popup.
 * Compile a prompt with the on-device engine or a cloud key, review the result, then insert it.
 */
document.addEventListener("DOMContentLoaded", () => {
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const ENTER_HINT = isMac ? "⌘↵" : "Ctrl+Enter";
  const PASTE_HINT = isMac ? "⌘V" : "Ctrl+V";
  // Core elements
  const input = document.getElementById("input");
  const charCount = document.getElementById("char-count");
  const tokenEstimate = document.getElementById("token-estimate");
  const enhanceBtn = document.getElementById("enhance-btn");
  const btnText = document.getElementById("btn-text");
  const btnTimer = document.getElementById("btn-timer");
  const btnKbdPill = document.getElementById("btn-kbd-pill");
  const toastMsg = document.getElementById("toast-msg");
  const panelResult = document.getElementById("panel-result");
  const resultBody = document.getElementById("result-body");
  const reviewSwitch = document.getElementById("review-switch");
  const reviewTabDiff = document.getElementById("review-tab-diff");
  const reviewTabResult = document.getElementById("review-tab-result");
  const diffBefore = document.getElementById("diff-before");
  const diffAfter = document.getElementById("diff-after");
  const loopBadge = document.getElementById("loop-telemetry-badge");
  const copyBtn = document.getElementById("copy-btn");
  const useBtn = document.getElementById("use-btn");
  const saveCloudBtn = document.getElementById("save-cloud-btn");
  // Labels live in their own spans so swapping text never deletes the button icon.
  const copyBtnLabel = document.getElementById("copy-btn-label");
  const useBtnLabel = document.getElementById("use-btn-label");
  const saveCloudBtnLabel = document.getElementById("save-cloud-btn-label");
  const resultTokenDelta = document.getElementById("result-token-delta");
  const openStudioBtn = document.getElementById("open-studio-btn");
  const backToEditBtn = document.getElementById("back-to-edit-btn");
  const pasteBtn = document.getElementById("paste-btn");
  const clearBtn = document.getElementById("clear-btn");
  const modeApi = document.getElementById("mode-api");
  const modeAlgo = document.getElementById("mode-algo");
  const modeDevice = document.getElementById("mode-device");
  const voiceBtn = document.getElementById("voice-btn");
  const userAvatar = document.getElementById("user-avatar");
  const userName = document.getElementById("user-name");
  const syncStatusText = document.getElementById("sync-status-text");
  const syncDot = document.getElementById("sync-dot");
  const syncLatencyBadge = document.getElementById("sync-latency-badge");

  // Usage card elements
  const runwayRingFg = document.getElementById("runway-ring-fg");
  const runwayRingPct = document.getElementById("runway-ring-pct");
  const activeBotPill = document.getElementById("active-bot-pill");
  const runwayStatusTag = document.getElementById("runway-status-tag");
  const runwayUsedTxt = document.getElementById("runway-used-txt");
  const runwayRemBadge = document.getElementById("runway-rem-badge");
  const runwayBurnRate = document.getElementById("runway-burn-rate");
  const runwayFill = document.getElementById("runway-fill");

  // Prompt+ Quota Elements
  const tokenRemainingBadge = document.getElementById("token-remaining-badge");
  const headerVersionPill = document.getElementById("header-version-pill");
  if (headerVersionPill) headerVersionPill.textContent = `v${chrome.runtime.getManifest().version}`;
  const tokenNeededTxt = document.getElementById("token-needed-txt");
  const tokenMeterFill = document.getElementById("token-meter-fill");

  // Tab Panels
  const tabBtnEnhance = document.getElementById("tab-btn-enhance");
  const tabBtnLibrary = document.getElementById("tab-btn-library");
  const tabBtnContext = document.getElementById("tab-btn-context");
  const tabBtnSettings = document.getElementById("tab-btn-settings");
  const panelEnhance = document.getElementById("panel-enhance");
  const panelLibrary = document.getElementById("panel-library");
  const panelContext = document.getElementById("panel-context");
  const panelSettings = document.getElementById("panel-settings");
  const libraryGrid = document.getElementById("library-grid");
  const libSearch = document.getElementById("lib-search");
  const contextVaultList = document.getElementById("context-vault-list");
  const historyTimelineList = document.getElementById("history-timeline-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  // Settings & Health Elements
  const settingsHealthStatus = document.getElementById("settings-health-status");
  const settingsHealthUrl = document.getElementById("settings-health-url");
  const pingHealthBtn = document.getElementById("ping-health-btn");
  const settingsAuthStatus = document.getElementById("settings-auth-status");
  const settingsUserName = document.getElementById("settings-user-name");
  const settingsQuotaTxt = document.getElementById("settings-quota-txt");
  const manualSyncBtn = document.getElementById("manual-sync-btn");
  const customApiKeyInput = document.getElementById("custom-api-key-input");
  const saveKeyBtn = document.getElementById("save-key-btn");
  const bridgeSendAll = document.getElementById("bridge-send-all");
  const contextPickerBtn = document.getElementById("context-picker-btn");
  const contextPickerCount = document.getElementById("context-picker-count");
  const quickRecentBtn = document.getElementById("quick-recent-btn");
  const quickStudioBtn = document.getElementById("quick-studio-btn");
  const openPanelBtn = document.getElementById("open-panel-btn");

  let currentMode = "algo";
  let currentTone = "human";
  let enhancedResult = "";
  let rawPromptMemory = "";
  let lastResultSource = "";
  let isListening = false;
  let recognitionInstance = null;
  let compileTimerInterval = null;
  let compileStartTime = 0;
  let liveTokenData = null;

  let userQuota = null;
  let cloudPrompts = [];
  let contextRules = [
    { id: "react_tailwind", name: "Next.js 16 + Tailwind CSS v4", desc: "Production React 19 rules, responsive styling, anti-slop guidelines", active: true },
    { id: "fastapi", name: "Python FastAPI Architecture", desc: "Strict typing, Pydantic v2, and async DB patterns", active: true },
    { id: "exec_tone", name: "Executive Strategic Tone", desc: "Zero conversational fluff, bulleted takeaways & KPI focus", active: false },
    { id: "security", name: "OWASP & Input Validation", desc: "Strict input sanitization, rate limiting, and defensive bounds", active: true },
  ];

  const DEFAULT_TEMPLATES = [
    {
      id: "code-architect",
      title: "Senior Full-Stack Code Architect",
      category: "Development",
      text: "Act as a Principal Software Engineer. Review and implement a clean, type-safe, production-ready solution for: {{task}}. Include error handling, architecture notes, and unit tests.",
    },
    {
      id: "landing-copy",
      title: "High-Converting SaaS Landing Copy",
      category: "Marketing",
      text: "Act as an elite conversion copywriter. Write a high-converting hero section, value proposition, and 3 feature benefit bullets for: {{product}}.",
    },
    {
      id: "executive-brief",
      title: "C-Level Executive Strategy Memo",
      category: "Strategy",
      text: "Act as a Senior Management Consultant. Create an executive summary memo for {{initiative}}, with strategic objectives, ROI impact, and a 90-day phased roadmap.",
    },
    {
      id: "root-cause-debug",
      title: "Root Cause Bug Diagnostic Engine",
      category: "Debugging",
      text: "Act as a Lead Systems Debugger. Analyze this error/stack trace: {{error_details}}. Identify the root cause, edge conditions, and provide a minimal robust fix.",
    },
  ];

  // Vendor names only. The exact model is reported live by the page adapter when it can be read.
  const BOT_PROFILES = [
    { match: "chatgpt", name: "ChatGPT", maxContext: 128000, color: "#10a37f" },
    { match: "claude", name: "Claude", maxContext: 200000, color: "#d97706" },
    { match: "gemini", name: "Gemini", maxContext: 1000000, color: "#3b82f6" },
    { match: "deepseek", name: "DeepSeek", maxContext: 128000, color: "#6366f1" },
    { match: "grok", name: "Grok", maxContext: 128000, color: "#ec4899" },
    { match: "perplexity", name: "Perplexity", maxContext: 32000, color: "#20808d" },
    { match: "copilot", name: "Copilot", maxContext: 128000, color: "#0078d4" },
    { match: "meta", name: "Meta AI", maxContext: 128000, color: "#0668e1" },
  ];

  let activeBot = { name: "Universal AI", maxContext: 128000, color: "#6366f1" };

  // Canonical tone names. The in-page dock and modal use the same words.
  const TONE_LABELS = { human: "Natural", code: "Technical", exec: "Executive", copy: "Marketing", deep: "Reasoning" };

  function formatK(num) {
    if (num == null) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  }

  // Single token-count path for the whole popup, with the same fallback the content script uses.
  function countTokens(text) {
    if (!text) return 0;
    if (window.PromptPlusTokenizer && typeof window.PromptPlusTokenizer.count === "function") {
      return window.PromptPlusTokenizer.count(text);
    }
    return Math.ceil(text.length / 3.8);
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---------- 1. Live chat usage & tab token state ----------
  function applyLiveTokenState(data) {
    if (!data) return;
    liveTokenData = data;

    const limit = data.contextLimit || activeBot.maxContext || 128000;
    const used = data.conversationTokens || 0;
    const remaining = data.tokensRemaining != null ? data.tokensRemaining : Math.max(0, limit - used);
    const known = !!data.contextLimitKnown;
    const pct = !known ? 0 : data.percentUsed != null ? data.percentUsed : Math.min(100, (used / limit) * 100);

    if (activeBotPill) {
      activeBotPill.textContent = data.modelName || activeBot.name;
    }

    let color = "#10b981";
    let statusText = known ? "Estimated" : "Not measured";

    if (pct >= 95) {
      color = "#dc2626";
      statusText = "Nearly full";
    } else if (pct >= 80) {
      color = "#ef4444";
      statusText = "80% full";
    } else if (pct >= 60) {
      color = "#f59e0b";
      statusText = "Filling up";
    }

    if (runwayStatusTag) {
      runwayStatusTag.textContent = statusText;
      runwayStatusTag.style.color = color;
      runwayStatusTag.style.borderColor = color + "40";
    }

    // Ring circumference = 2 * PI * 18 ≈ 113.1
    if (runwayRingFg) {
      const circumference = 113.1;
      runwayRingFg.style.strokeDashoffset = circumference - (pct / 100) * circumference;
      runwayRingFg.style.stroke = color;
    }

    if (runwayRingPct) {
      runwayRingPct.textContent = known ? `${Math.round(pct)}%` : "—";
    }

    if (runwayFill) {
      runwayFill.style.width = `${Math.min(100, pct)}%`;
      runwayFill.style.background = color;
    }

    if (runwayRemBadge) {
      // Nothing to say when the limit is unknown: the ring already shows "—".
      runwayRemBadge.textContent = known ? `~${formatK(remaining)} left` : "";
      runwayRemBadge.style.color = known ? color : "var(--text-dim)";
    }

    if (runwayUsedTxt) {
      runwayUsedTxt.textContent = known
        ? `~${formatK(used)} of ${formatK(limit)} used`
        : used > 0 ? `~${formatK(used)} tokens visible` : "Open a chat to measure it";
    }

    if (runwayBurnRate) {
      const PACE = { steady: "Steady pace", heavy: "Heavy usage", accelerating: "Growing faster", decelerating: "Slowing down" };
      const pace = PACE[data.burnRate] || "";
      const turns = data.turnCount ? `${data.turnCount} turns` : "";
      runwayBurnRate.textContent = [pace, turns].filter(Boolean).join(" · ");
    }
  }

  // Fetch initial token state from background
  try {
    chrome.runtime?.sendMessage({ action: "getTokenState" }, (res) => {
      if (res?.data) {
        applyLiveTokenState(res.data);
      }
    });
  } catch {}

  // ---------- Draft recovery ----------
  // Chrome closes the popup the moment focus moves and the extension cannot stop
  // it. The draft, the chosen context and a finished result are kept in storage
  // and restored on reopen, so nothing typed is lost.
  const DRAFT_KEY = "pp_popup_draft";

  function saveDraft() {
    // Only a result the user is actually looking at is worth resuming.
    const resultVisible = !!(panelResult && panelResult.style.display !== "none");
    try {
      chrome.storage.local.set({
        [DRAFT_KEY]: {
          input: input ? input.value : "",
          tone: currentTone,
          context: contextRules.map((r) => ({ id: r.id, active: r.active })),
          result: resultVisible ? (enhancedResult || "") : "",
          raw: rawPromptMemory || "",
          source: resultVisible ? (lastResultSource || "") : "",
        },
      });
    } catch {}
  }

  // Prefill from the chat the user is on, but only when there is no saved draft
  // to overwrite.
  function autoFillFromActiveTab() {
    try {
      chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs?.[0];
        if (tab?.id && input && !input.value.trim()) {
          chrome.tabs.sendMessage(tab.id, { action: "getActivePrompt" }, (r) => {
            if (chrome.runtime?.lastError) return;
            if (r?.text && !input.value.trim()) {
              input.value = r.text;
              input.dispatchEvent(new Event("input"));
            }
          });
        }
      });
    } catch {}
  }

  function restoreDraft() {
    try {
      chrome.storage.local.get(DRAFT_KEY, (data) => {
        const draft = data?.[DRAFT_KEY];
        if (!draft) {
          autoFillFromActiveTab();
          return;
        }
        if (Array.isArray(draft.context)) {
          draft.context.forEach((saved) => {
            const rule = contextRules.find((r) => r.id === saved.id);
            if (rule) rule.active = !!saved.active;
          });
          updateContextPicker();
        }
        if (draft.tone && TONE_LABELS[draft.tone]) {
          currentTone = draft.tone;
          document.querySelectorAll(".tone-pill-btn, .tone-chip").forEach((c) => {
            c.classList.toggle("active", c.getAttribute("data-tone") === draft.tone);
          });
        }
        if (draft.input && input && !input.value.trim()) {
          input.value = draft.input;
          input.dispatchEvent(new Event("input"));
        }
        if (draft.raw) rawPromptMemory = draft.raw;
        if (draft.result) {
          // A finished result survives reopening: resume exactly where you left off.
          lastResultSource = draft.source || "";
          showResultView(draft.result, "", lastResultSource);
        } else {
          autoFillFromActiveTab();
        }
      });
    } catch {
      autoFillFromActiveTab();
    }
  }
  restoreDraft();

  // Listen for broadcast token updates
  try {
    chrome.runtime?.onMessage.addListener((msg) => {
      if ((msg.action === "tokenStateUpdate" || msg.action === "tokenUpdate") && (msg.data || msg.platform)) {
        applyLiveTokenState(msg.data || msg);
      }
    });
  } catch {}

  // ---------- 2. Active Tab & Bot Detection ----------
  function detectActiveChatbot() {
    try {
      chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs?.[0]?.url || "";
        const lower = url.toLowerCase();
        for (const p of BOT_PROFILES) {
          if (lower.includes(p.match)) {
            activeBot = p;
            break;
          }
        }
        if (activeBotPill && !liveTokenData) {
          activeBotPill.textContent = activeBot.name;
        }
        updateTokenMetrics();
      });
    } catch {}
  }
  detectActiveChatbot();

  // Scan open tabs for multi-AI active dots
  function checkOpenAITabs() {
    try {
      chrome.tabs?.query({}, (tabs) => {
        const urls = (tabs || []).map((t) => (t.url || "").toLowerCase());
        BOT_PROFILES.forEach((p) => {
          const dot = document.getElementById(`dot-${p.match}`);
          if (dot) {
            const isOpen = urls.some((u) => u.includes(p.match));
            if (isOpen) dot.classList.add("is-active");
            else dot.classList.remove("is-active");
          }
        });
      });
    } catch {}
  }
  checkOpenAITabs();

  // ---------- 3. Typing cost ----------
  function updateTokenMetrics() {
    const raw = input ? input.value : "";
    const estTokens = countTokens(raw);

    if (charCount) charCount.textContent = `${raw.length} char${raw.length === 1 ? "" : "s"}`;
    if (tokenEstimate) tokenEstimate.textContent = `~${estTokens} tokens`;
    if (tokenNeededTxt) tokenNeededTxt.textContent = `~${estTokens} tok in`;

    if (tokenMeterFill && userQuota) {
      const fillPct = Math.max(0, Math.min(100, Math.round((userQuota.remaining / userQuota.monthlyLimit) * 100)));
      tokenMeterFill.style.width = `${fillPct}%`;
    }
  }

  if (input) {
    input.addEventListener("input", updateTokenMetrics);
    input.addEventListener("input", saveDraft);
  }

  // How many context rules are currently added to every prompt.
  function updateContextPicker() {
    if (!contextPickerCount) return;
    const count = contextRules.filter((r) => r.active).length;
    contextPickerCount.textContent = count === 0 ? "none" : `${count} rule${count === 1 ? "" : "s"}`;
  }
  updateContextPicker();

  // ---------- 4. Engine Switcher ----------
  const ENGINE_LABELS = { algo: "Enhance prompt", device: "Enhance with Chrome AI", api: "Enhance with cloud key" };

  function updateEnhanceButtonLabel() {
    if (!btnText) return;
    btnText.textContent = ENGINE_LABELS[currentMode] || ENGINE_LABELS.algo;
    if (enhanceBtn) enhanceBtn.title = `Shortcut: ${ENTER_HINT}`;
    if (btnKbdPill) {
      btnKbdPill.textContent = ENTER_HINT;
      btnKbdPill.hidden = false;
    }
  }

  function setMode(mode) {
    currentMode = mode;
    [[modeApi, "api"], [modeAlgo, "algo"], [modeDevice, "device"]].forEach(([btn, m]) => {
      if (!btn) return;
      btn.classList.toggle("active", mode === m);
      btn.setAttribute("aria-pressed", String(mode === m));
    });
    updateEnhanceButtonLabel();
  }

  if (modeApi) modeApi.addEventListener("click", () => setMode("api"));
  if (modeAlgo) modeAlgo.addEventListener("click", () => setMode("algo"));
  if (modeDevice) modeDevice.addEventListener("click", () => setMode("device"));

  // Chrome's on-device model is not in every build. Hide the option instead of offering a dead end.
  (async () => {
    try {
      const lm = window.LanguageModel || window.ai?.languageModel;
      if (!lm || (await lm.availability()) === "unavailable") {
        if (modeDevice) modeDevice.style.display = "none";
      }
    } catch {
      if (modeDevice) modeDevice.style.display = "none";
    }
  })();

  setMode(currentMode);

  // ---------- 5. Tab Navigation ----------
  const tabs = [
    { btn: tabBtnEnhance, panel: panelEnhance },
    { btn: tabBtnLibrary, panel: panelLibrary },
    { btn: tabBtnContext, panel: panelContext },
    { btn: tabBtnSettings, panel: panelSettings },
  ];

  function switchTab(targetBtn, targetPanel) {
    tabs.forEach(({ btn, panel }) => {
      btn?.classList.remove("active");
      btn?.setAttribute("aria-selected", "false");
      if (panel) panel.style.display = "none";
    });
    if (panelResult) panelResult.style.display = "none";
    targetBtn?.classList.add("active");
    targetBtn?.setAttribute("aria-selected", "true");
    if (targetPanel) targetPanel.style.display = "flex";
    if (targetPanel === panelLibrary) renderLibrary();
    if (targetPanel === panelContext) renderContextVault();
    if (targetPanel === panelSettings) renderSettings();
  }

  tabs.forEach(({ btn, panel }, i) => {
    btn?.addEventListener("click", () => switchTab(btn, panel));
    btn?.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      switchTab(next.btn, next.panel);
      next.btn?.focus();
    });
  });

  // Quick entry: jump straight to the context rules, saved work, or the studio.
  contextPickerBtn?.addEventListener("click", () => switchTab(tabBtnContext, panelContext));
  quickRecentBtn?.addEventListener("click", () => switchTab(tabBtnLibrary, panelLibrary));

  // The side panel opens from a user gesture, so it is this one click and nothing
  // earlier. Older Chrome without chrome.sidePanel.open keeps a working popup:
  // the control stays hidden instead of becoming a dead button.
  if (openPanelBtn && chrome.sidePanel?.open) {
    openPanelBtn.hidden = false;
    openPanelBtn.addEventListener("click", () => {
      saveDraft(); // hands the current draft to the panel through storage
      chrome.sidePanel
        .open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
        .catch(() => showToast("This page cannot show the side panel.", true));
    });
  }

  // Tone Chips & Pills
  document.querySelectorAll(".tone-pill-btn, .tone-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".tone-pill-btn, .tone-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentTone = chip.getAttribute("data-tone") || "human";
      saveDraft();
    });
  });

  // Advanced Tools Drawer Toggle
  const advancedToggle = document.getElementById("advanced-tools-toggle");
  const advancedDrawer = document.getElementById("advanced-tools-drawer");
  const advancedArrow = document.getElementById("advanced-arrow");
  let isAdvancedOpen = false;

  function toggleAdvanced() {
    isAdvancedOpen = !isAdvancedOpen;
    if (advancedDrawer) advancedDrawer.style.display = isAdvancedOpen ? "flex" : "none";
    if (advancedArrow) advancedArrow.textContent = isAdvancedOpen ? "▴" : "▾";
    advancedToggle?.setAttribute("aria-expanded", String(isAdvancedOpen));
  }

  advancedToggle?.addEventListener("click", toggleAdvanced);
  advancedToggle?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleAdvanced();
    }
  });

  // Action Buttons
  pasteBtn?.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && input) {
        input.value = text;
        input.dispatchEvent(new Event("input"));
        input.focus();
      }
    } catch {
      showToast("Clipboard permission required.", true);
    }
  });

  clearBtn?.addEventListener("click", () => {
    if (input) {
      input.value = "";
      input.dispatchEvent(new Event("input"));
      input.focus();
    }
  });

  // Voice Dictation
  if (voiceBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;

      recognitionInstance.onstart = () => {
        isListening = true;
        voiceBtn.classList.add("recording");
        const span = voiceBtn.querySelector("span");
        if (span) span.textContent = "Listening...";
      };

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join("");
        if (input && transcript) {
          input.value = (input.value ? input.value + " " : "") + transcript;
          input.dispatchEvent(new Event("input"));
        }
      };

      recognitionInstance.onerror = () => {
        isListening = false;
        voiceBtn.classList.remove("recording");
        const span = voiceBtn.querySelector("span");
        if (span) span.textContent = "Voice";
        showToast("Microphone error or permission denied", true);
      };

      recognitionInstance.onend = () => {
        isListening = false;
        voiceBtn.classList.remove("recording");
        const span = voiceBtn.querySelector("span");
        if (span) span.textContent = "Voice";
      };

      voiceBtn.addEventListener("click", () => {
        if (!isListening) {
          try {
            recognitionInstance.start();
          } catch {
            recognitionInstance.stop();
          }
        } else {
          recognitionInstance.stop();
        }
      });
    } else {
      voiceBtn.addEventListener("click", () => {
        showToast("Speech recognition not supported in this browser", true);
      });
    }
  }

  // Toast System
  let toastTimer = null;
  function showToast(msg, isErr = false) {
    if (!toastMsg) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastMsg.textContent = msg;
    toastMsg.className = `toast-msg ${isErr ? "err" : "ok"}`;
    toastMsg.style.display = "block";
    toastTimer = setTimeout(() => {
      toastMsg.style.display = "none";
    }, 2800);
  }

  // ---------- 6. Multi-AI Launcher (8 Platforms) ----------
  function openMultiAITab(platform, promptText = null) {
    const text = promptText != null ? promptText : (enhancedResult || (input ? input.value.trim() : ""));
    const encoded = encodeURIComponent(text);
    let target = "";

    switch (platform) {
      case "chatgpt": target = `https://chatgpt.com/?q=${encoded}`; break;
      case "claude": target = `https://claude.ai/new?q=${encoded}`; break;
      case "gemini": target = `https://gemini.google.com/app?prompt=${encoded}`; break;
      case "deepseek": target = `https://chat.deepseek.com/?prompt=${encoded}`; break;
      case "grok": target = `https://grok.com/?q=${encoded}`; break;
      case "perplexity": target = `https://www.perplexity.ai/search?q=${encoded}`; break;
      case "copilot": target = `https://copilot.microsoft.com/?q=${encoded}`; break;
      case "meta": target = `https://www.meta.ai/?prompt=${encoded}`; break;
    }

    if (target) {
      chrome.tabs.create({ url: target });
    }
  }

  BOT_PROFILES.forEach((p) => {
    document.getElementById(`bridge-${p.match}`)?.addEventListener("click", () => openMultiAITab(p.match));
  });

  bridgeSendAll?.addEventListener("click", () => {
    const text = enhancedResult || (input ? input.value.trim() : "");
    if (!text) {
      showToast("Type or compile a prompt first!", true);
      return;
    }
    ["chatgpt", "claude", "gemini", "deepseek"].forEach((bot) => openMultiAITab(bot, text));
    showToast("Launching across 4 primary AI platforms!");
  });

  // ---------- 7. Connection Health & Web Sync System ----------
  async function updateHealthDisplay() {
    try {
      chrome.runtime?.sendMessage({ action: "getHealthStatus" }, (res) => {
        const health = res?.health;
        if (!health) return;

        const isOk = health.status === "connected";
        const isDegraded = health.status === "degraded";

        if (syncDot) {
          syncDot.className = "sync-indicator-dot";
          if (!isOk && !isDegraded) syncDot.classList.add("offline");
        }

        if (syncStatusText) {
          syncStatusText.textContent = isOk ? "Connected" : isDegraded ? "Degraded" : health.status === "unknown" ? "Not checked" : "Offline";
        }

        if (syncLatencyBadge) {
          syncLatencyBadge.textContent = health.latencyMs > 0 ? `${health.latencyMs}ms` : "—";
          syncLatencyBadge.style.color = isOk ? "#94a3b8" : isDegraded ? "#f59e0b" : "#ef4444";
        }

        if (settingsHealthStatus) {
          const color = isOk ? "#10b981" : isDegraded ? "#f59e0b" : "#ef4444";
          settingsHealthStatus.innerHTML = `
            <span style="width:6px; height:6px; border-radius:50%; background:${color}; display:inline-block;"></span>
            ${isOk ? `Connected (${health.latencyMs}ms)` : isDegraded ? `Degraded (${health.latencyMs}ms)` : health.status === "unknown" ? "Not checked" : "Offline"}
          `;
          settingsHealthStatus.style.color = color;
        }

        if (settingsHealthUrl && health.url) {
          settingsHealthUrl.textContent = health.url.replace("https://", "").replace("http://", "");
        }
      });
    } catch {}
  }
  updateHealthDisplay();

  pingHealthBtn?.addEventListener("click", () => {
    pingHealthBtn.textContent = "...";
    chrome.runtime?.sendMessage({ action: "triggerHealthCheck" }, (res) => {
      pingHealthBtn.textContent = "Ping";
      updateHealthDisplay();
      if (res?.health?.latencyMs > 0) {
        showToast(`Server latency: ${res.health.latencyMs}ms`);
      } else {
        showToast("Server ping failed.", true);
      }
    });
  });

  async function syncWithWebPlatform() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "syncAuth" }, (authData) => {
        // This path owns identity and quota. The connection label has exactly one
        // owner, the health probe: writing "Offline" here meant every signed-out
        // user was told the server was unreachable while it was healthy.
        if (authData?.authenticated && authData.user) {
          if (userName) userName.textContent = authData.user.name ? authData.user.name.split(" ")[0] : "Account";
          if (userAvatar && authData.user.avatar) userAvatar.src = authData.user.avatar;

          if (authData.quota) {
            userQuota = authData.quota;
            if (tokenRemainingBadge) {
              tokenRemainingBadge.textContent = `${userQuota.remaining}/${userQuota.monthlyLimit} left`;
            }
          }
          if (authData.savedBlocks && authData.savedBlocks.length > 0) {
            // The API returns ContextBlock ({name, content}); the library renders {title, text}.
            // Without this mapping every cloud blueprint rendered blank.
            cloudPrompts = authData.savedBlocks.map((b) => ({
              id: b.id,
              title: b.name,
              text: b.content,
              category: b.category,
            }));
          }
        } else {
          if (userName) userName.textContent = "Guest";
        }
        updateTokenMetrics();
        resolve(authData);
      });
    });
  }
  syncWithWebPlatform();

  function renderSettings() {
    updateHealthDisplay();
    chrome.storage.local.get("pp_web_session", (data) => {
      const authData = data?.pp_web_session;
      if (authData?.authenticated && authData.user) {
        if (settingsAuthStatus) {
          settingsAuthStatus.textContent = "Connected";
          settingsAuthStatus.style.color = "#10b981";
        }
        if (settingsUserName) settingsUserName.textContent = authData.user.name || authData.user.email;
        if (settingsQuotaTxt && authData.quota) {
          settingsQuotaTxt.textContent = `${authData.quota.remaining} of ${authData.quota.monthlyLimit} left this month`;
        }
      } else {
        if (settingsAuthStatus) {
          settingsAuthStatus.textContent = "Not connected";
          settingsAuthStatus.style.color = "var(--text-muted)";
        }
      }
    });

    chrome.runtime.sendMessage({ action: "getApiKey" }, (res) => {
      if (res?.apiKey && customApiKeyInput) {
        customApiKeyInput.value = res.apiKey;
      }
    });
  }

  manualSyncBtn?.addEventListener("click", async () => {
    manualSyncBtn.textContent = "Syncing…";
    await syncWithWebPlatform();
    renderSettings();
    setTimeout(() => {
      manualSyncBtn.textContent = "Synced";
      setTimeout(() => { manualSyncBtn.textContent = "Sync with web account"; }, 1800);
    }, 400);
  });

  saveKeyBtn?.addEventListener("click", () => {
    const rawKey = customApiKeyInput ? customApiKeyInput.value.trim() : "";
    chrome.runtime.sendMessage({ action: "saveApiKey", apiKey: rawKey }, (r) => {
      if (r?.success) {
        showToast("Key encrypted and saved on this device.");
      }
    });
  });

  // ---------- 8. Prompt History Timeline (Phase 5) ----------
  function saveToHistory(orig, enhanced, tone) {
    chrome.storage.local.get("pp_prompt_history", (data) => {
      let list = data?.pp_prompt_history || [];
      const item = {
        id: "hist-" + Date.now(),
        original: orig.slice(0, 160),
        enhanced,
        tone,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      list = [item, ...list].slice(0, 20); // Keep last 20
      chrome.storage.local.set({ pp_prompt_history: list });
    });
  }

  function renderHistory() {
    if (!historyTimelineList) return;
    chrome.storage.local.get("pp_prompt_history", (data) => {
      const list = data?.pp_prompt_history || [];
      if (list.length === 0) {
        historyTimelineList.innerHTML = `<div style="font-size:10.5px; color:#71717a; text-align:center; padding:12px;">No recent compilations yet.</div>`;
        return;
      }

      historyTimelineList.innerHTML = list.map((item) => `
        <div class="history-item">
          <div class="history-item-main">
            <div class="history-item-title">${escapeHtml(item.original)}</div>
            <div class="history-item-meta">${item.timestamp} · ${escapeHtml(TONE_LABELS[item.tone] || item.tone || "")}</div>
          </div>
          <button type="button" class="load-hist-btn" data-id="${item.id}">Load</button>
        </div>
      `).join("");

      historyTimelineList.querySelectorAll(".load-hist-btn").forEach((b) => {
        b.addEventListener("click", () => {
          const id = b.getAttribute("data-id");
          const target = list.find((x) => x.id === id);
          if (target && input) {
            input.value = target.original;
            input.dispatchEvent(new Event("input"));
            switchTab(tabBtnEnhance, panelEnhance);
            showToast("Loaded from history!");
          }
        });
      });
    });
  }

  clearHistoryBtn?.addEventListener("click", () => {
    chrome.storage.local.set({ pp_prompt_history: [] }, () => {
      renderHistory();
      showToast("History cleared.");
    });
  });

  // ---------- 9. Blueprints & Context Vault ----------
  function renderLibrary() {
    renderHistory();
    if (!libraryGrid) return;
    const filter = (libSearch?.value || "").toLowerCase().trim();
    const allTemplates = [...DEFAULT_TEMPLATES, ...cloudPrompts];
    const filtered = allTemplates.filter(
      (t) => (t.title || "").toLowerCase().includes(filter) || (t.text || "").toLowerCase().includes(filter)
    );

    libraryGrid.innerHTML = filtered.map((tpl) => `
      <div class="library-card" data-id="${tpl.id}">
        <div class="library-card-header">
          <span class="library-card-title">${escapeHtml(tpl.title)}</span>
          <span class="library-card-category">${escapeHtml(tpl.category || "General")}</span>
        </div>
        <div class="library-card-desc">${escapeHtml(tpl.text)}</div>
        <div class="library-card-footer">
          <button type="button" class="use-blueprint-btn" data-text="${escapeHtml(tpl.text)}">Insert</button>
        </div>
      </div>
    `).join("");

    libraryGrid.querySelectorAll(".use-blueprint-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const text = e.target.getAttribute("data-text");
        if (text && input) {
          input.value = text;
          input.dispatchEvent(new Event("input"));
          switchTab(tabBtnEnhance, panelEnhance);
          input.focus();
        }
      });
    });
  }

  libSearch?.addEventListener("input", renderLibrary);

  function renderContextVault() {
    if (!contextVaultList) return;
    contextVaultList.innerHTML = contextRules.map((rule) => `
      <div class="context-rule-card ${rule.active ? "active" : ""}" data-id="${rule.id}">
        <div class="context-rule-head">
          <strong class="context-rule-name">${escapeHtml(rule.name)}</strong>
          <input type="checkbox" class="rule-toggle" ${rule.active ? "checked" : ""} data-id="${rule.id}" aria-label="${escapeHtml(rule.name)}" />
        </div>
        <div class="context-rule-desc">${escapeHtml(rule.desc)}</div>
      </div>
    `).join("");

    contextVaultList.querySelectorAll(".rule-toggle").forEach((chk) => {
      chk.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        const r = contextRules.find((x) => x.id === id);
        if (r) r.active = e.target.checked;
        renderContextVault();
        updateContextPicker();
        saveDraft();
      });
    });
  }

  // ---------- 10. Local Prompt Synthesizer ----------
  function synthesizeLocalPrompt(text) {
    return globalThis.PromptPlusSynthesis.synthesizeLocalPrompt(text, { tone: currentTone, context: contextRules.filter(r => r.active).map(r => r.content || r.name) });
  }

  // ---------- 11. Enhance Action Trigger with Animated States ----------
  async function triggerCompilation() {
    const rawText = input ? input.value.trim() : "";
    if (!rawText) {
      showToast("Please type a prompt idea first!", true);
      if (input) input.focus();
      return;
    }

    rawPromptMemory = rawText;

    // Start animated loading state
    if (enhanceBtn) {
      enhanceBtn.disabled = true;
      enhanceBtn.classList.remove("is-success");
      enhanceBtn.classList.add("is-loading");
    }
    if (btnText) btnText.textContent = "Enhancing…";
    if (btnTimer) {
      btnTimer.style.display = "inline";
      btnTimer.textContent = "(0.0s)";
      compileStartTime = Date.now();
      compileTimerInterval = setInterval(() => {
        const sec = ((Date.now() - compileStartTime) / 1000).toFixed(1);
        btnTimer.textContent = `(${sec}s)`;
      }, 100);
    }

    let finalResult = "";
    let resultSource = "Local template (offline)";

    // Mode 1: No-API Offline Turbo Engine
    if (currentMode === "algo") {
      finalResult = synthesizeLocalPrompt(rawText);
    }

    // Mode 2: Chrome's on-device model
    if (!finalResult && currentMode === "device") {
      try {
        const w = window;
        const lm = w.LanguageModel || w.ai?.languageModel;
        if (lm && (await lm.availability()) !== "unavailable") {
          const session = await lm.create({ temperature: 0.1, topK: 1 });
          const promptText = `Rewrite this into a structured prompt with role, specs and steps:\n\n"${rawText}"`;
          finalResult = await session.prompt(promptText);
          resultSource = "On-device model";
          session.destroy();
        }
      } catch {}
    }

    // Mode 3: Cloud AI Multi-Model Router
    if (!finalResult) {
      try {
        const res = await new Promise((resolve) => {
          // shortcut: 30s cap with no cancel button. Raise it only if cloud generations routinely exceed it.
          const timer = setTimeout(() => resolve(null), 30000);
          chrome.runtime.sendMessage(
            { action: "enhancePrompt", text: rawText, mode: currentMode, tone: currentTone },
            (r) => {
              clearTimeout(timer);
              resolve(r);
            }
          );
        });

        if (res?.success && res.data?.enhanced) {
          finalResult = res.data.enhanced;
          resultSource = res.data.source === "engine" ? "Deterministic engine" : res.data.source === "local-template" ? "Local template (offline)" : "Cloud model";
        }
      } catch {}
    }

    // Fallback if network was offline
    if (!finalResult) {
      finalResult = synthesizeLocalPrompt(rawText);
    }

    // Stop timer
    if (compileTimerInterval) clearInterval(compileTimerInterval);
    if (btnTimer) btnTimer.style.display = "none";

    const elapsedMs = Date.now() - compileStartTime;

    // Animated completion state
    if (enhanceBtn) {
      enhanceBtn.disabled = false;
      enhanceBtn.classList.remove("is-loading");
      enhanceBtn.classList.add("is-success");
      if (btnText) btnText.textContent = "✓ Enhanced";

      setTimeout(() => {
        enhanceBtn.classList.remove("is-success");
        updateEnhanceButtonLabel();
      }, 1600);
    }

    // Save to history timeline
    saveToHistory(rawText, finalResult, currentTone);

    showResultView(finalResult, `${Math.max(0, elapsedMs)}ms`, resultSource);
    showToast(resultSource);
  }

  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", triggerCompilation);
  }

  // Cmd/Ctrl+Enter enhances. Escape only leaves the result view when it is actually open,
  // so it stops swallowing the key while the user is typing.
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      triggerCompilation();
    } else if (e.key === "Escape" && panelResult && panelResult.style.display !== "none") {
      showEditView();
    }
  });

  // ---------- 12. Result View Management ----------
  // Review step first: the compiled prompt is shown as a diff against the input,
  // so what the enhancement changed is visible before it gets inserted.
  function setReviewMode(mode) {
    if (!panelResult) return;
    const showingDiff = mode !== "result";
    panelResult.classList.toggle("mode-diff", showingDiff);
    panelResult.classList.toggle("mode-result", !showingDiff);
    [reviewTabDiff, reviewTabResult].forEach((tab) => {
      if (!tab) return;
      const active = tab === (showingDiff ? reviewTabDiff : reviewTabResult);
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }

  reviewTabDiff?.addEventListener("click", () => setReviewMode("diff"));
  reviewTabResult?.addEventListener("click", () => setReviewMode("result"));

  function showResultView(text, latency, source) {
    enhancedResult = text;
    lastResultSource = source || "";
    if (panelEnhance) panelEnhance.style.display = "none";
    if (panelResult) {
      panelResult.style.display = "flex";
      if (resultBody) {
        resultBody.textContent = text;
        resultBody.classList.remove("flash-in");
        void resultBody.offsetWidth; // reflow so a repeat compile replays the flash
        resultBody.classList.add("flash-in");
      }
      if (reviewSwitch && diffBefore && diffAfter && window.PromptPlusDiff) {
        const review = window.PromptPlusDiff.highlight(rawPromptMemory, text);
        diffBefore.innerHTML = review.before;
        diffAfter.innerHTML = review.after;
        reviewSwitch.hidden = !review.changed;
        setReviewMode(review.changed ? "diff" : "result");
      }
      if (loopBadge) loopBadge.textContent = [source, latency].filter(Boolean).join(" · ");
      if (resultTokenDelta) {
        const before = countTokens(rawPromptMemory);
        const after = countTokens(text);
        resultTokenDelta.textContent = before > 0
          ? `${before} → ${after} tokens (${after - before >= 0 ? "+" : ""}${after - before})`
          : `${after} tokens`;
      }
    }
    saveDraft();
  }

  function showEditView() {
    if (panelResult) panelResult.style.display = "none";
    if (panelEnhance) panelEnhance.style.display = "flex";
    if (input) input.focus();
    saveDraft();
  }

  backToEditBtn?.addEventListener("click", showEditView);

  const setCopyLabel = (s) => { if (copyBtnLabel) copyBtnLabel.textContent = s; };
  const setUseLabel = (s) => { if (useBtnLabel) useBtnLabel.textContent = s; };
  const setSaveLabel = (s) => { if (saveCloudBtnLabel) saveCloudBtnLabel.textContent = s; };

  // One clipboard path, so every failure surfaces the same honest message.
  async function copyResultToClipboard() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(enhancedResult);
      return true;
    } catch {
      showToast("Clipboard unavailable. Select and copy the result manually.", true);
      return false;
    }
  }

  copyBtn?.addEventListener("click", async () => {
    if (!enhancedResult) return;
    if (!(await copyResultToClipboard())) return;
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy"), 2000);
  });

  useBtn?.addEventListener("click", () => {
    if (!enhancedResult) return;
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (!tab?.id) {
        void copyResultToClipboard();
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: "injectEnhanced", enhanced: enhancedResult }, async (r) => {
        if (chrome.runtime?.lastError || !r?.success) {
          // No injectable page (chrome://, the extension itself): copy instead, and say so.
          if (!(await copyResultToClipboard())) return;
          setUseLabel("Copied to Clipboard!");
          showToast(`Copied. Paste it into the chat (${PASTE_HINT}).`);
          setTimeout(() => setUseLabel("Apply"), 2500);
        } else {
          setUseLabel(r.pendingReview ? "Review in chat" : "✓ Inserted");
          showToast(r.pendingReview ? "Review the changes in your chat before accepting." : "Inserted into the active chat.");
          setTimeout(() => setUseLabel("Apply"), 2000);
        }
      });
    });
  });

  saveCloudBtn?.addEventListener("click", () => {
    if (!enhancedResult) return;
    setSaveLabel("Saving…");
    chrome.runtime.sendMessage(
      {
        action: "saveToCloudPrompt",
        originalText: rawPromptMemory || enhancedResult.slice(0, 100),
        enhancedText: enhancedResult,
        category: `Extension v${chrome.runtime.getManifest().version}`,
        tone: currentTone,
      },
      (r) => {
        if (r?.success) {
          setSaveLabel("Saved");
          showToast("Saved to your Prompt+ library.");
        } else {
          setSaveLabel("Save to library");
          showToast(r?.error || "Sign in to Prompt+ to save to your library.", true);
        }
        setTimeout(() => setSaveLabel("Save to library"), 2500);
      }
    );
  });

  function openStudio() {
    chrome.runtime.sendMessage({
      action: "openInWebStudio",
      prompt: rawPromptMemory || enhancedResult,
      tone: currentTone,
    });
  }

  openStudioBtn?.addEventListener("click", openStudio);
  quickStudioBtn?.addEventListener("click", openStudio);
});
