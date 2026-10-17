/**
 * Prompt+ Architect AI Extension v3.0.0
 * High-Performance Prompt Compiler, Real-Time Context Runway, Multi-AI Bridge & Bi-Directional Web Sync.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Core Compiler Elements
  const input = document.getElementById("input");
  const charCount = document.getElementById("char-count");
  const tokenEstimate = document.getElementById("token-estimate");
  const enhanceBtn = document.getElementById("enhance-btn");
  const btnText = document.getElementById("btn-text");
  const btnTimer = document.getElementById("btn-timer");
  const toastMsg = document.getElementById("toast-msg");
  const panelResult = document.getElementById("panel-result");
  const resultBody = document.getElementById("result-body");
  const scoreBadge = document.getElementById("quality-score-badge");
  const loopBadge = document.getElementById("loop-telemetry-badge");
  const copyBtn = document.getElementById("copy-btn");
  const useBtn = document.getElementById("use-btn");
  const saveCloudBtn = document.getElementById("save-cloud-btn");
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

  // Context Runway Widget Elements
  const runwayRingFg = document.getElementById("runway-ring-fg");
  const runwayRingPct = document.getElementById("runway-ring-pct");
  const activeBotPill = document.getElementById("active-bot-pill");
  const runwayStatusTag = document.getElementById("runway-status-tag");
  const runwayUsedTxt = document.getElementById("runway-used-txt");
  const runwayRemBadge = document.getElementById("runway-rem-badge");
  const runwayEstMsgs = document.getElementById("runway-est-msgs");
  const runwayBurnRate = document.getElementById("runway-burn-rate");
  const runwayFill = document.getElementById("runway-fill");
  const runwayDrawerToggle = document.getElementById("runway-drawer-toggle");
  const runwayDrawerDetails = document.getElementById("runway-drawer-details");
  const runwayBreakdownSummary = document.getElementById("runway-breakdown-summary");
  const runwayToggleArrow = document.getElementById("runway-toggle-arrow");
  const runwayUserTok = document.getElementById("runway-user-tok");
  const runwayAiTok = document.getElementById("runway-ai-tok");
  const runwayAvgTurn = document.getElementById("runway-avg-turn");
  const runwayMaxTurn = document.getElementById("runway-max-turn");

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

  let currentMode = "api";
  let currentTone = "human";
  let enhancedResult = "";
  let rawPromptMemory = "";
  let isListening = false;
  let recognitionInstance = null;
  let compileTimerInterval = null;
  let compileStartTime = 0;
  let isDrawerOpen = false;
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

  const BOT_PROFILES = [
    { match: "chatgpt", name: "ChatGPT · GPT-4o", maxContext: 128000, color: "#10a37f" },
    { match: "claude", name: "Claude 3.5 Sonnet", maxContext: 200000, color: "#d97706" },
    { match: "gemini", name: "Gemini 2.0 Flash", maxContext: 1000000, color: "#3b82f6" },
    { match: "deepseek", name: "DeepSeek R1", maxContext: 128000, color: "#6366f1" },
    { match: "grok", name: "Grok 3", maxContext: 128000, color: "#ec4899" },
    { match: "perplexity", name: "Perplexity AI", maxContext: 32000, color: "#06b6d4" },
    { match: "copilot", name: "Microsoft Copilot", maxContext: 128000, color: "#0078d4" },
    { match: "meta", name: "Meta AI (Llama 3)", maxContext: 128000, color: "#0668e1" },
  ];

  let activeBot = { name: "Universal AI", maxContext: 128000, color: "#6366f1" };

  function formatK(num) {
    if (num == null) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
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

  // ---------- 1. Live Context Runway & Tab Token State ----------
  function applyLiveTokenState(data) {
    if (!data) return;
    liveTokenData = data;

    const limit = data.contextLimit || activeBot.maxContext || 128000;
    const used = data.conversationTokens || 0;
    const remaining = data.tokensRemaining != null ? data.tokensRemaining : Math.max(0, limit - used);
    const pct = !data.contextLimitKnown ? 0 : data.percentUsed != null ? data.percentUsed : Math.min(100, (used / limit) * 100);

    // Update active bot label
    if (activeBotPill) {
      activeBotPill.textContent = data.modelName || activeBot.name;
    }

    // Color tier calibration
    let color = "#10b981";
    let statusText = data.contextLimitKnown ? "Estimated" : "Limit unknown";
    let remBadgeStyle = "background: rgba(16, 185, 129, 0.12); color: #34d399;";

    if (pct >= 95) {
      color = "#dc2626";
      statusText = "🚨 Critical Limit";
      remBadgeStyle = "background: rgba(220, 38, 38, 0.25); color: #fca5a5; font-weight: 800;";
    } else if (pct >= 80) {
      color = "#ef4444";
      statusText = "⚠ 80% Full";
      remBadgeStyle = "background: rgba(239, 68, 68, 0.2); color: #f87171;";
    } else if (pct >= 60) {
      color = "#f59e0b";
      statusText = "Filling Up";
      remBadgeStyle = "background: rgba(245, 158, 11, 0.16); color: #fbbf24;";
    }

    if (runwayStatusTag) {
      runwayStatusTag.textContent = statusText;
      runwayStatusTag.style.color = color;
      runwayStatusTag.style.borderColor = color + "40";
    }

    // Animate Circular SVG Ring (Circumference = 2 * PI * 18 ≈ 113.1)
    if (runwayRingFg) {
      const circumference = 113.1;
      const offset = circumference - (pct / 100) * circumference;
      runwayRingFg.style.strokeDashoffset = offset;
      runwayRingFg.style.stroke = color;
    }

    if (runwayRingPct) {
      runwayRingPct.textContent = data.contextLimitKnown ? `~${Math.round(pct)}%` : "—";
    }

    if (runwayFill) {
      runwayFill.style.width = `${Math.min(100, pct)}%`;
      runwayFill.style.background = color;
    }

    if (runwayUsedTxt) {
      runwayUsedTxt.textContent = `~${formatK(used)} visible tokens`;
    }

    if (runwayRemBadge) {
      runwayRemBadge.textContent = data.contextLimitKnown ? `~${formatK(remaining)} remaining` : "Capacity unknown";
      runwayRemBadge.style.cssText = remBadgeStyle;
    }

    if (runwayEstMsgs) {
      const msgs = data.estimatedMessagesLeft != null ? data.estimatedMessagesLeft : Math.floor(remaining / 800);
      runwayEstMsgs.textContent = data.contextLimitKnown ? `~${msgs} exchanges left` : "Visible messages only";
    }

    if (runwayBurnRate) {
      const burn = data.burnRate ? `${data.burnRate.charAt(0).toUpperCase() + data.burnRate.slice(1)} burn` : "Steady burn";
      runwayBurnRate.textContent = `· ${burn}`;
    }

    // Breakdown Details
    if (runwayBreakdownSummary) {
      runwayBreakdownSummary.textContent = `You: ${formatK(data.userTokens || 0)} · AI: ${formatK(data.aiTokens || 0)} · ${data.turnCount || 0} turns`;
    }
    if (runwayUserTok) runwayUserTok.textContent = `${(data.userTokens || 0).toLocaleString()} tok`;
    if (runwayAiTok) runwayAiTok.textContent = `${(data.aiTokens || 0).toLocaleString()} tok`;
    if (runwayAvgTurn) runwayAvgTurn.textContent = `${(data.avgTokensPerTurn || 0).toLocaleString()} tok`;
    if (runwayMaxTurn) runwayMaxTurn.textContent = `${(data.largestTurnTokens || 0).toLocaleString()} tok`;
  }

  // Fetch initial token state from background
  try {
    chrome.runtime?.sendMessage({ action: "getTokenState" }, (res) => {
      if (res?.data) {
        applyLiveTokenState(res.data);
      }
    });
  } catch {}

  // Auto-fetch active tab prompt if input is currently empty
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

  // Listen for broadcast token updates
  try {
    chrome.runtime?.onMessage.addListener((msg) => {
      if ((msg.action === "tokenStateUpdate" || msg.action === "tokenUpdate") && (msg.data || msg.platform)) {
        applyLiveTokenState(msg.data || msg);
      }
    });
  } catch {}

  // Toggle Breakdown Accordion
  runwayDrawerToggle?.addEventListener("click", () => {
    isDrawerOpen = !isDrawerOpen;
    if (runwayDrawerDetails) runwayDrawerDetails.style.display = isDrawerOpen ? "block" : "none";
    if (runwayToggleArrow) runwayToggleArrow.textContent = isDrawerOpen ? "▴" : "▾";
  });

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

  // ---------- 3. Dynamic Typing Token Calculator ----------
  function updateTokenMetrics() {
    const raw = input ? input.value : "";
    const len = raw.length;

    // Use fast tokenizer if available
    let estTokens = 0;
    if (window.PromptPlusTokenizer && typeof window.PromptPlusTokenizer.count === "function") {
      estTokens = window.PromptPlusTokenizer.count(raw);
    } else {
      estTokens = Math.ceil(len / 3.8);
    }

    if (charCount) charCount.textContent = `${len} char${len === 1 ? "" : "s"}`;
    if (tokenEstimate) tokenEstimate.textContent = `~${estTokens} Tokens`;
    if (tokenNeededTxt) tokenNeededTxt.textContent = `~${estTokens} tok input`;

    // Dynamic Context Headroom adjustment
    if (liveTokenData) {
      const dynamicRemaining = Math.max(0, liveTokenData.tokensRemaining - estTokens);
      if (runwayRemBadge) {
        runwayRemBadge.textContent = liveTokenData.contextLimitKnown ? `~${formatK(dynamicRemaining)} remaining` : "Capacity unknown";
      }
    } else {
      if (runwayRemBadge) {
        runwayRemBadge.textContent = "Capacity unknown";
      }
    }

    // Prompt+ Quota Fill
    if (tokenMeterFill && userQuota) {
      const fillPct = Math.max(0, Math.min(100, Math.round((userQuota.remaining / userQuota.monthlyLimit) * 100)));
      tokenMeterFill.style.width = `${fillPct}%`;
    }
  }

  if (input) {
    input.addEventListener("input", updateTokenMetrics);
  }

  // ---------- 4. Button Mode Switcher with Dynamic Labels ----------
  function updateEnhanceButtonLabel() {
    if (!btnText) return;
    if (currentMode === "algo") {
      btnText.textContent = "⚡ Turbo Local IR (⌘↵)";
    } else if (currentMode === "device") {
      btnText.textContent = "⚡ Gemini Nano Compile (⌘↵)";
    } else {
      btnText.textContent = "⚡ Compile via Cloud AI (⌘↵)";
    }
  }

  function setMode(mode) {
    currentMode = mode;
    [modeApi, modeAlgo, modeDevice].forEach((b) => b?.classList.remove("active"));
    if (mode === "api" && modeApi) modeApi.classList.add("active");
    else if (mode === "algo" && modeAlgo) modeAlgo.classList.add("active");
    else if (mode === "device" && modeDevice) modeDevice.classList.add("active");
    updateEnhanceButtonLabel();
  }

  if (modeApi) modeApi.addEventListener("click", () => setMode("api"));
  if (modeAlgo) modeAlgo.addEventListener("click", () => setMode("algo"));
  if (modeDevice) modeDevice.addEventListener("click", () => setMode("device"));
  updateEnhanceButtonLabel();

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
      if (panel) panel.style.display = "none";
    });
    if (panelResult) panelResult.style.display = "none";
    targetBtn?.classList.add("active");
    if (targetPanel) targetPanel.style.display = "flex";
    if (targetPanel === panelLibrary) renderLibrary();
    if (targetPanel === panelContext) renderContextVault();
    if (targetPanel === panelSettings) renderSettings();
  }

  tabBtnEnhance?.addEventListener("click", () => switchTab(tabBtnEnhance, panelEnhance));
  tabBtnLibrary?.addEventListener("click", () => switchTab(tabBtnLibrary, panelLibrary));
  tabBtnContext?.addEventListener("click", () => switchTab(tabBtnContext, panelContext));
  tabBtnSettings?.addEventListener("click", () => switchTab(tabBtnSettings, panelSettings));

  // Tone Chips & Pills
  document.querySelectorAll(".tone-pill-btn, .tone-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".tone-pill-btn, .tone-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentTone = chip.getAttribute("data-tone") || "human";
    });
  });

  // Advanced Tools Drawer Toggle
  const advancedToggle = document.getElementById("advanced-tools-toggle");
  const advancedDrawer = document.getElementById("advanced-tools-drawer");
  const advancedArrow = document.getElementById("advanced-arrow");
  let isAdvancedOpen = false;

  advancedToggle?.addEventListener("click", () => {
    isAdvancedOpen = !isAdvancedOpen;
    if (advancedDrawer) advancedDrawer.style.display = isAdvancedOpen ? "flex" : "none";
    if (advancedArrow) advancedArrow.textContent = isAdvancedOpen ? "▴" : "▾";
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
        if (authData?.authenticated && authData.user) {
          if (syncStatusText) syncStatusText.textContent = "Connected";
          if (syncDot) syncDot.classList.remove("offline");
          if (userName) userName.textContent = authData.user.name ? authData.user.name.split(" ")[0] : "Studio";
          if (userAvatar && authData.user.avatar) userAvatar.src = authData.user.avatar;

          if (authData.quota) {
            userQuota = authData.quota;
            if (tokenRemainingBadge) {
              tokenRemainingBadge.textContent = `${userQuota.remaining} / ${userQuota.monthlyLimit} units`;
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
          if (syncStatusText) syncStatusText.textContent = "Local Mode";
          if (syncDot) syncDot.classList.add("offline");
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
          settingsQuotaTxt.textContent = `${authData.quota.remaining} / ${authData.quota.monthlyLimit} Units`;
        }
      } else {
        if (settingsAuthStatus) {
          settingsAuthStatus.textContent = "Local Mode";
          settingsAuthStatus.style.color = "#a1a1aa";
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
    manualSyncBtn.textContent = "Syncing with Web...";
    await syncWithWebPlatform();
    renderSettings();
    setTimeout(() => {
      manualSyncBtn.textContent = "Sync Complete";
      setTimeout(() => { manualSyncBtn.textContent = "Force Sync with Web Account"; }, 1800);
    }, 400);
  });

  saveKeyBtn?.addEventListener("click", () => {
    const rawKey = customApiKeyInput ? customApiKeyInput.value.trim() : "";
    chrome.runtime.sendMessage({ action: "saveApiKey", apiKey: rawKey }, (r) => {
      if (r?.success) {
        showToast("API Key encrypted & saved!");
      }
    });
  });

  // ---------- 8. Prompt History Timeline (Phase 5) ----------
  function saveToHistory(orig, enhanced, tone, score) {
    chrome.storage.local.get("pp_prompt_history", (data) => {
      let list = data?.pp_prompt_history || [];
      const item = {
        id: "hist-" + Date.now(),
        original: orig.slice(0, 160),
        enhanced,
        tone,
        score,
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
        <div style="background: rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:7px; padding:7px 9px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="min-width:0; flex:1;">
            <div style="font-size:10.5px; font-weight:600; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(item.original)}</div>
            <div style="font-size:9.5px; color:#a1a1aa; margin-top:2px;">${item.timestamp} · Structure estimate: ${item.score ?? "Not assessed"} · Tone: ${item.tone}</div>
          </div>
          <button type="button" class="load-hist-btn" data-id="${item.id}" style="background:rgba(99,102,241,0.2); border:1px solid rgba(99,102,241,0.4); color:#c7d2fe; font-size:9.5px; font-weight:700; border-radius:5px; padding:2px 7px; cursor:pointer;">Load</button>
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
          <button type="button" class="use-blueprint-btn" data-text="${escapeHtml(tpl.text)}">Insert Blueprint</button>
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
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:11.5px; color:#fff;">${escapeHtml(rule.name)}</strong>
          <input type="checkbox" class="rule-toggle" ${rule.active ? "checked" : ""} data-id="${rule.id}" style="cursor:pointer;" />
        </div>
        <div style="font-size:10px; color:#a1a1aa; margin-top:2px;">${escapeHtml(rule.desc)}</div>
      </div>
    `).join("");

    contextVaultList.querySelectorAll(".rule-toggle").forEach((chk) => {
      chk.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        const r = contextRules.find((x) => x.id === id);
        if (r) r.active = e.target.checked;
        renderContextVault();
      });
    });
  }

  // ---------- 10. Local Prompt Synthesizer ----------
  function synthesizeLocalPrompt(text) {
    return globalThis.PromptPlusSynthesis.synthesizeLocalPrompt(text, { tone: currentTone, context: contextRules.filter(r => r.active).map(r => r.content || r.name) });
  }

  function calculateScore(text) {
    let score = 70;
    if (text.includes("### ROLE")) score += 8;
    if (text.includes("SPECIFICATIONS") || text.includes("OBJECTIVE")) score += 7;
    if (text.includes("PROTOCOL") || text.includes("STEPS")) score += 7;
    if (text.length > 350) score += 4;
    return Math.min(99, score);
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
      enhanceBtn.classList.remove("is-success", "is-error");
      enhanceBtn.classList.add("is-loading");
    }
    if (btnText) btnText.textContent = "Compiling Master Prompt...";
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

    // Mode 2: Chrome On-Device Gemini Nano
    if (!finalResult && currentMode === "device") {
      try {
        const w = window;
        const lm = w.LanguageModel || w.ai?.languageModel;
        if (lm && (await lm.availability()) !== "unavailable") {
          const session = await lm.create({ temperature: 0.1, topK: 1 });
          const promptText = `Transform into a structured Master Prompt with Role, Specs, and Steps:\n\n"${rawText}"`;
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
          const timer = setTimeout(() => resolve(null), 55000);
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

    const qScore = calculateScore(finalResult);
    const elapsedMs = Date.now() - compileStartTime;

    // Animated completion state
    if (enhanceBtn) {
      enhanceBtn.disabled = false;
      enhanceBtn.classList.remove("is-loading");
      enhanceBtn.classList.add("is-success");
      if (btnText) btnText.textContent = "✓ Master Prompt Compiled!";

      setTimeout(() => {
        enhanceBtn.classList.remove("is-success");
        updateEnhanceButtonLabel();
      }, 1600);
    }

    // Save to history timeline
    saveToHistory(rawText, finalResult, currentTone, qScore);

    showResultView(finalResult, qScore, `${Math.max(0, elapsedMs)}ms`);
    showToast(resultSource);
    if (scoreBadge) scoreBadge.textContent = resultSource;
  }

  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", triggerCompilation);
  }

  // Keyboard Shortcuts: Cmd+Enter to compile, Esc to edit
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      triggerCompilation();
    } else if (e.key === "Escape") {
      showEditView();
    }
  });

  // ---------- 12. Result View Management ----------
  function showResultView(text, score, latency) {
    enhancedResult = text;
    if (panelEnhance) panelEnhance.style.display = "none";
    if (panelResult) {
      panelResult.style.display = "flex";
      if (resultBody) resultBody.textContent = text;
      if (scoreBadge) scoreBadge.textContent = `Structure estimate: ${score}/100`;
      if (loopBadge) loopBadge.textContent = `⚡ ${latency}`;
    }
  }

  function showEditView() {
    if (panelResult) panelResult.style.display = "none";
    if (panelEnhance) panelEnhance.style.display = "flex";
    if (input) input.focus();
  }

  backToEditBtn?.addEventListener("click", showEditView);

  copyBtn?.addEventListener("click", async () => {
    if (enhancedResult) {
      try { await navigator.clipboard.writeText(enhancedResult); } catch { showToast("Clipboard unavailable. Select and copy the result manually.", true); return; }
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy Prompt"; }, 2000);
    }
  });

  useBtn?.addEventListener("click", () => {
    if (enhancedResult) {
      chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs?.[0];
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { action: "injectEnhanced", enhanced: enhancedResult }, async (r) => {
            if (chrome.runtime?.lastError || !r?.success) {
              // Copy to clipboard fallback if tab is not inject-eligible (e.g. chrome:// or store)
              try {
                if (!navigator.clipboard) throw new Error("Clipboard unavailable");
                await navigator.clipboard?.writeText(enhancedResult);
              } catch {
                showToast("Clipboard unavailable. Select and copy the result manually.", true);
                return;
              }
              useBtn.textContent = "Copied to Clipboard!";
              showToast("Copied! Switch to ChatGPT/Claude/Gemini to paste (⌘V)", false);
              setTimeout(() => { useBtn.textContent = "Use in Active Tab"; }, 2500);
            } else {
              useBtn.textContent = r.pendingReview ? "Review in Chat" : "✓ Injected!";
              showToast(r.pendingReview ? "Review the changes in your chat before accepting." : "✓ Injected directly into active chat!", false);
              setTimeout(() => { useBtn.textContent = "Use in Active Tab"; }, 2000);
            }
          });
        } else {
          navigator.clipboard?.writeText(enhancedResult);
          showToast("Copied to clipboard!", false);
        }
      });
    }
  });

  saveCloudBtn?.addEventListener("click", () => {
    if (!enhancedResult) return;
    saveCloudBtn.textContent = "Saving...";
    chrome.runtime.sendMessage(
      {
        action: "saveToCloudPrompt",
        originalText: rawPromptMemory || enhancedResult.slice(0, 100),
        enhancedText: enhancedResult,
        category: "Extension v3.0",
        tone: currentTone,
      },
      (r) => {
        if (r?.success) {
          saveCloudBtn.textContent = "Saved!";
          showToast("Saved to Prompt+ Cloud Library!");
        } else {
          saveCloudBtn.textContent = "Save to Cloud";
          showToast(r?.error || "Login to Prompt+ Web required to sync cloud.", true);
        }
        setTimeout(() => { saveCloudBtn.textContent = "Save to Cloud"; }, 2500);
      }
    );
  });

  openStudioBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "openInWebStudio",
      prompt: rawPromptMemory || enhancedResult,
      tone: currentTone,
    });
  });
});
