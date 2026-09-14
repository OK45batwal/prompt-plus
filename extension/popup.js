/**
 * Prompt+ Architect AI Extension v2.1.3.2
 * High-performance prompt compiler, context memory bridge & bi-directional sync engine.
 */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const charCount = document.getElementById("char-count");
  const tokenEstimate = document.getElementById("token-estimate");
  const enhanceBtn = document.getElementById("enhance-btn");
  const btnText = document.getElementById("btn-text");
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
  const activeBotPill = document.getElementById("active-bot-pill");
  const tokenNeededTxt = document.getElementById("token-needed-txt");
  const tokenRemainingBadge = document.getElementById("token-remaining-badge");
  const tokenMeterFill = document.getElementById("token-meter-fill");
  const contextCapacityTxt = document.getElementById("context-capacity-txt");

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

  // Settings Elements
  const settingsAuthStatus = document.getElementById("settings-auth-status");
  const settingsUserName = document.getElementById("settings-user-name");
  const settingsQuotaTxt = document.getElementById("settings-quota-txt");
  const manualSyncBtn = document.getElementById("manual-sync-btn");
  const customApiKeyInput = document.getElementById("custom-api-key-input");
  const saveKeyBtn = document.getElementById("save-key-btn");

  let currentMode = "api";
  let currentTone = "human";
  let enhancedResult = "";
  let rawPromptMemory = "";
  let isListening = false;
  let recognitionInstance = null;
  let userQuota = { remaining: 100, monthlyLimit: 100, usagePercentage: 0 };
  let cloudPrompts = [];
  let contextRules = [
    { id: "react_tailwind", name: "Next.js 16 + Tailwind CSS v4", desc: "Production React 19 rules, responsive styling, anti-slop guidelines", active: true },
    { id: "fastapi", name: "Python FastAPI Architecture", desc: "Strict typing, Pydantic v2, and async DB patterns", active: true },
    { id: "exec_tone", name: "Executive Strategic Tone", desc: "Zero conversational fluff, bulleted takeaways & KPI focus", active: false },
    { id: "security", name: "OWASP & Input Validation", desc: "Strict input sanitization, rate limiting, and defensive bounds", active: true },
  ];

  // Default Blueprints
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

  // Chatbot Model Context Matrix
  const BOT_PROFILES = [
    { match: "chatgpt", name: "ChatGPT · GPT-4o", maxContext: 128000, color: "#10a37f" },
    { match: "claude", name: "Claude 3.5 Sonnet", maxContext: 200000, color: "#d97706" },
    { match: "gemini", name: "Gemini 2.0 Flash", maxContext: 1000000, color: "#3b82f6" },
    { match: "deepseek", name: "DeepSeek R1", maxContext: 128000, color: "#6366f1" },
    { match: "grok", name: "Grok 3", maxContext: 128000, color: "#ec4899" },
    { match: "perplexity", name: "Perplexity AI", maxContext: 32000, color: "#06b6d4" },
    { match: "copilot", name: "Microsoft Copilot", maxContext: 128000, color: "#0078d4" },
    { match: "v0.dev", name: "v0.dev UI Architect", maxContext: 128000, color: "#ffffff" },
  ];

  let activeBot = { name: "Universal AI", maxContext: 128000, color: "#6366f1" };

  // HTML Entity Escaping Utility
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // 1. Detect Active Chatbot in the Current Tab
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
        if (activeBotPill) {
          activeBotPill.textContent = activeBot.name;
          activeBotPill.style.borderColor = activeBot.color;
          activeBotPill.style.color = "#ffffff";
        }
        updateTokenMetrics();
      });
    } catch {
      // Fallback
    }
  }
  detectActiveChatbot();

  // 2. Navigation Tab Switching
  function switchTab(tab) {
    [tabBtnEnhance, tabBtnLibrary, tabBtnContext, tabBtnSettings].forEach((b) => b?.classList.remove("active"));
    [panelEnhance, panelResult, panelLibrary, panelContext, panelSettings].forEach((p) => {
      if (p) p.style.display = "none";
    });

    if (tab === "enhance") {
      tabBtnEnhance?.classList.add("active");
      if (panelEnhance) panelEnhance.style.display = "flex";
      if (input) input.focus();
    } else if (tab === "library") {
      tabBtnLibrary?.classList.add("active");
      if (panelLibrary) panelLibrary.style.display = "flex";
      loadBlueprints();
    } else if (tab === "context") {
      tabBtnContext?.classList.add("active");
      if (panelContext) panelContext.style.display = "flex";
      renderContextVault();
    } else if (tab === "settings") {
      tabBtnSettings?.classList.add("active");
      if (panelSettings) panelSettings.style.display = "flex";
      renderSettings();
    }
  }

  tabBtnEnhance?.addEventListener("click", () => switchTab("enhance"));
  tabBtnLibrary?.addEventListener("click", () => switchTab("library"));
  tabBtnContext?.addEventListener("click", () => switchTab("context"));
  tabBtnSettings?.addEventListener("click", () => switchTab("settings"));

  // 3. Stage 1 <-> Stage 2 Transition (Editor vs Result View)
  function showResultView(compiledText, score = 96, latency = "<20ms") {
    if (panelEnhance) panelEnhance.style.display = "none";
    if (panelResult) panelResult.style.display = "flex";
    if (resultBody) resultBody.textContent = compiledText;
    if (scoreBadge) scoreBadge.textContent = `Score: ${score}/100`;
    if (loopBadge) loopBadge.textContent = `⚡ ${latency}`;
    enhancedResult = compiledText;
  }

  function showEditView() {
    if (panelResult) panelResult.style.display = "none";
    if (panelEnhance) panelEnhance.style.display = "flex";
    if (input) input.focus();
  }

  backToEditBtn?.addEventListener("click", showEditView);

  // 4. Quick Paste & Clear Buttons
  pasteBtn?.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && input) {
        input.value = text;
        input.dispatchEvent(new Event("input"));
        showToast("Text pasted from clipboard!");
      }
    } catch {
      showToast("Clipboard access denied.", true);
    }
  });

  clearBtn?.addEventListener("click", () => {
    if (input) {
      input.value = "";
      input.dispatchEvent(new Event("input"));
      input.focus();
    }
  });

  // 5. Load & Render Blueprints
  function loadBlueprints() {
    chrome.runtime.sendMessage({ action: "getTemplates" }, (res) => {
      if (res?.success && res.data) {
        const curated = res.data.curated || [];
        const userP = res.data.userPrompts || [];
        cloudPrompts = [...userP, ...curated];
      }
      renderLibrary(libSearch?.value.trim() || "");
    });
  }

  function renderLibrary(filterText = "") {
    if (!libraryGrid) return;
    const all = cloudPrompts.length > 0 ? cloudPrompts : DEFAULT_TEMPLATES;
    const filtered = filterText
      ? all.filter((t) => (t.title + (t.category || "") + (t.text || t.enhancedText || "")).toLowerCase().includes(filterText.toLowerCase()))
      : all;

    if (filtered.length === 0) {
      libraryGrid.innerHTML = `
        <div style="text-align: center; padding: 24px 12px; color: #71717a; font-size: 11.5px;">
          No matching templates found.
        </div>
      `;
      return;
    }

    libraryGrid.innerHTML = filtered.map((item) => `
      <div class="template-card" data-prompt="${encodeURIComponent(item.enhancedText || item.text || item.originalText || "")}">
        <div class="template-title-row">
          <span class="template-title">${escapeHtml(item.title || "Untitled Blueprint")}</span>
          <span class="template-cat-badge">${escapeHtml(item.category || "Cloud")}</span>
        </div>
        <div class="template-preview">${escapeHtml(item.text || item.enhancedText || item.originalText || "")}</div>
      </div>
    `).join("");

    libraryGrid.querySelectorAll(".template-card").forEach((card) => {
      card.addEventListener("click", () => {
        const text = decodeURIComponent(card.getAttribute("data-prompt") || "");
        if (input) {
          input.value = text;
          switchTab("enhance");
          showEditView();
          input.dispatchEvent(new Event("input"));
          showToast("Template loaded into compiler!");
        }
      });
    });
  }

  if (libSearch) {
    libSearch.addEventListener("input", () => {
      renderLibrary(libSearch.value.trim());
    });
  }

  // 6. Interactive Context Vault
  function loadContextRules(cb) {
    chrome.storage.local.get("pp_context_rules", (data) => {
      if (data?.pp_context_rules && Array.isArray(data.pp_context_rules)) {
        contextRules = data.pp_context_rules;
      }
      if (cb) cb();
    });
  }

  function saveContextRules() {
    chrome.storage.local.set({ pp_context_rules: contextRules });
  }

  function getActiveContextNames() {
    return contextRules.filter((r) => r.active).map((r) => r.name);
  }

  function renderContextVault() {
    if (!contextVaultList) return;
    loadContextRules(() => {
      contextVaultList.innerHTML = contextRules.map((item, idx) => `
        <div class="vault-card">
          <div class="vault-card-info">
            <div class="vault-card-title">${escapeHtml(item.name)}</div>
            <div class="vault-card-desc">${escapeHtml(item.desc)}</div>
          </div>
          <input type="checkbox" class="vault-checkbox" data-idx="${idx}" ${item.active ? "checked" : ""} />
        </div>
      `).join("");

      contextVaultList.querySelectorAll(".vault-checkbox").forEach((cb) => {
        cb.addEventListener("change", (e) => {
          const idx = parseInt(e.target.getAttribute("data-idx"), 10);
          if (!isNaN(idx) && contextRules[idx]) {
            contextRules[idx].active = e.target.checked;
            saveContextRules();
            showToast(`Rule "${contextRules[idx].name}" ${contextRules[idx].active ? "enabled" : "disabled"}`);
          }
        });
      });
    });
  }

  // 7. Tone Selector Handlers
  document.querySelectorAll(".tone-pill-btn").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".tone-pill-btn").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentTone = pill.getAttribute("data-tone") || "human";
    });
  });

  // 8. Multi-AI Split Launcher
  function openMultiAITab(platform) {
    const text = input ? input.value.trim() : "";
    const encoded = encodeURIComponent(text);
    let target = "";
    if (platform === "chatgpt") target = `https://chatgpt.com/?q=${encoded}`;
    else if (platform === "claude") target = `https://claude.ai/new?q=${encoded}`;
    else if (platform === "gemini") target = `https://gemini.google.com/app?prompt=${encoded}`;
    else if (platform === "deepseek") target = `https://chat.deepseek.com/?prompt=${encoded}`;
    if (target) {
      chrome.tabs.create({ url: target });
    }
  }

  document.getElementById("bridge-chatgpt")?.addEventListener("click", () => openMultiAITab("chatgpt"));
  document.getElementById("bridge-claude")?.addEventListener("click", () => openMultiAITab("claude"));
  document.getElementById("bridge-gemini")?.addEventListener("click", () => openMultiAITab("gemini"));
  document.getElementById("bridge-deepseek")?.addEventListener("click", () => openMultiAITab("deepseek"));

  // 9. Web Account Sync & BYOK Key Storage
  async function syncWithWebPlatform() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "syncAuth" }, (authData) => {
        if (authData?.authenticated && authData.user) {
          if (syncStatusText) syncStatusText.textContent = "Cloud Synced";
          if (syncDot) syncDot.classList.remove("offline");
          if (userName) userName.textContent = authData.user.name ? authData.user.name.split(" ")[0] : "Studio";
          if (userAvatar && authData.user.avatar) userAvatar.src = authData.user.avatar;

          if (authData.quota) {
            userQuota = authData.quota;
            if (tokenRemainingBadge) {
              tokenRemainingBadge.textContent = `${userQuota.remaining} / ${userQuota.monthlyLimit} Free Units`;
            }
          }
          if (authData.savedBlocks && authData.savedBlocks.length > 0) {
            cloudPrompts = authData.savedBlocks;
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

  // 10. Real-Time Token Calculation
  function updateTokenMetrics() {
    const raw = input ? input.value : "";
    const len = raw.length;
    const estTokens = Math.ceil(len / 3.8);
    const availableContext = Math.max(0, activeBot.maxContext - estTokens);
    const availableK = (availableContext / 1000).toFixed(1);

    if (charCount) charCount.textContent = `${len} char${len === 1 ? "" : "s"}`;
    if (tokenEstimate) tokenEstimate.textContent = `~${estTokens} Tokens`;
    if (tokenNeededTxt) tokenNeededTxt.textContent = `~${estTokens} tok`;
    if (contextCapacityTxt) {
      contextCapacityTxt.textContent = `${availableK}K free in ${activeBot.name.split(" ")[0]}`;
    }

    if (tokenMeterFill && userQuota) {
      const fillPct = Math.max(8, Math.min(100, Math.round((userQuota.remaining / (userQuota.monthlyLimit || 100)) * 100)));
      tokenMeterFill.style.width = `${fillPct}%`;
    }
  }

  if (input) {
    input.addEventListener("input", updateTokenMetrics);
  }

  // 11. Mode Switcher
  function setMode(mode) {
    currentMode = mode;
    [modeApi, modeAlgo, modeDevice].forEach((b) => b?.classList.remove("active"));

    if (mode === "api" && modeApi) modeApi.classList.add("active");
    else if (mode === "algo" && modeAlgo) modeAlgo.classList.add("active");
    else if (mode === "device" && modeDevice) modeDevice.classList.add("active");
  }

  if (modeApi) modeApi.addEventListener("click", () => setMode("api"));
  if (modeAlgo) modeAlgo.addEventListener("click", () => setMode("algo"));
  if (modeDevice) modeDevice.addEventListener("click", () => setMode("device"));

  // 12. Voice Dictation
  if (voiceBtn) {
    voiceBtn.addEventListener("click", async () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast("Speech recognition not supported.", true);
        return;
      }

      if (isListening) {
        if (recognitionInstance) {
          try { recognitionInstance.stop(); } catch {}
        }
        isListening = false;
        voiceBtn.classList.remove("recording");
        return;
      }

      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onstart = () => {
          isListening = true;
          voiceBtn.classList.add("recording");
          showToast("Listening... speak now");
        };

        rec.onresult = (e) => {
          let transcript = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            transcript += e.results[i][0].transcript;
          }
          if (input) {
            input.value = (input.value + " " + transcript).trim();
            input.dispatchEvent(new Event("input"));
          }
        };

        rec.onerror = () => {
          isListening = false;
          voiceBtn.classList.remove("recording");
        };

        rec.onend = () => {
          isListening = false;
          voiceBtn.classList.remove("recording");
        };

        rec.start();
        recognitionInstance = rec;
      } catch {
        showToast("Microphone permission denied.", true);
      }
    });
  }

  function showToast(text, isErr = false) {
    if (!toastMsg) return;
    toastMsg.textContent = text;
    toastMsg.className = `toast-msg ${isErr ? "err" : "ok"}`;
    toastMsg.style.display = "block";
    setTimeout(() => {
      toastMsg.style.display = "none";
    }, 3500);
  }

  function calculateScore(text) {
    if (!text) return 0;
    let score = 80;
    if (text.includes("### ROLE") || text.includes("### Persona") || text.includes("<persona>")) score += 8;
    if (text.includes("### SPECIFICATIONS") || text.includes("<specifications>")) score += 6;
    if (text.includes("### EXECUTION") || text.includes("<execution_steps>")) score += 4;
    return Math.min(99, score);
  }

  // 13. Offline Algorithmic Synthesis Fallback
  function synthesizeLocalPrompt(userInput) {
    const text = (userInput || "").trim();
    if (!text) return "";
    const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix|generate|make)\s+/i, "");
    const subject = cleanInput.length > 0 ? cleanInput : text;
    const activeBlocks = getActiveContextNames();

    let role = "Principal Technical Architect & Systems Engineer";
    let toneStr = "Technically Rigorous, Production-Ready";
    let sec1 = "SPECIFICATIONS & ARCHITECTURE";
    let sec2 = "IMPLEMENTATION PROTOCOL";

    if (currentTone === "human") {
      role = "Experienced Senior Peer & Pragmatic Thought Partner";
      toneStr = "Authentic, Human-Sounding, Natural Cadence & Zero Fluff";
      sec1 = "CORE GOAL & CONTEXT";
      sec2 = "PRAGMATIC EXECUTION STEPS";
    } else if (currentTone === "copy") {
      role = "Elite SaaS Conversion Copywriter & Brand Strategist";
      toneStr = "High-Converting, Punchy, Benefit-Driven & Psychologically Grounded";
      sec1 = "AUDIENCE, HOOK & VALUE PROPOSITION";
      sec2 = "CONVERSION FRAMEWORK & COPY PROTOCOL";
    } else if (currentTone === "exec") {
      role = "Senior Management Consultant & Enterprise Strategist";
      toneStr = "Board-Level Strategic Clarity, Executive Synthesis & Quantitative";
      sec1 = "EXECUTIVE SUMMARY & BUSINESS OBJECTIVES";
      sec2 = "STRATEGIC EXECUTION PHASES & ROI";
    } else if (currentTone === "deep") {
      role = "First-Principles Researcher & Systems Thinker";
      toneStr = "Exhaustive Analytical Depth, Formal Decomposition & Edge-Testing";
      sec1 = "PROBLEM DECOMPOSITION & CONSTRAINTS";
      sec2 = "SYSTEMATIC ANALYSIS & PROOF";
    }

    return `### ROLE & PERSONA
Act as an expert ${role}. You are addressing a high-priority problem with high precision.

### USER OBJECTIVE
"${text}"

### ${sec1}
- **Subject**: "${subject}"
- **Tone Profile**: ${toneStr}
- **Active Project Context**: ${activeBlocks.length > 0 ? activeBlocks.join(", ") : "Standard Production Guidelines"}
- **Quality Standard**: Deliver complete, production-grade output without omissions, placeholders, or conversational fluff.

### ${sec2}
1. Analyze the core requirements for "${subject}" and anticipate implicit edge cases.
2. Structure output with modular sections, scannable headers, and concrete code/examples.
3. Validate solution against security, scalability, and efficiency best practices.

### DELIVERABLES & OUTPUT FORMAT
- Deliver immediately usable, clean Markdown formatted content.`;
  }

  // 14. Enhance Action Trigger
  async function triggerCompilation() {
    const rawText = input ? input.value.trim() : "";
    if (!rawText) {
      showToast("Please type a prompt idea first!", true);
      if (input) input.focus();
      return;
    }

    rawPromptMemory = rawText;
    if (enhanceBtn) enhanceBtn.disabled = true;
    if (btnText) btnText.textContent = "Compiling Master Prompt...";

    let finalResult = "";

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
          session.destroy();
        }
      } catch {}
    }

    // Mode 3: Cloud AI Multi-Model Router
    if (!finalResult) {
      try {
        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: "enhancePrompt", text: rawText, mode: currentMode, tone: currentTone },
            (r) => resolve(r)
          );
        });

        if (res?.success && res.data?.enhanced) {
          finalResult = res.data.enhanced;
        }
      } catch {}
    }

    // Fail-Safe Fallback
    if (!finalResult) {
      finalResult = synthesizeLocalPrompt(rawText);
    }

    if (enhanceBtn) enhanceBtn.disabled = false;
    if (btnText) btnText.textContent = "Compile Master Prompt (⌘↵)";

    const qScore = calculateScore(finalResult);
    showResultView(finalResult, qScore, currentMode === "algo" ? "<15ms" : "<600ms");
    showToast("Master prompt compiled!");
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

  // 15. Action Buttons
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (enhancedResult) {
        navigator.clipboard.writeText(enhancedResult);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy Prompt"; }, 2000);
      }
    });
  }

  if (useBtn) {
    useBtn.addEventListener("click", () => {
      if (enhancedResult) {
        chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs?.[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "injectEnhanced", enhanced: enhancedResult }, (r) => {
              if (r?.success) {
                useBtn.textContent = "Injected!";
                setTimeout(() => { useBtn.textContent = "Use in Active Tab"; }, 2000);
              } else {
                showToast("Open ChatGPT / Claude / Gemini to inject directly!", true);
              }
            });
          }
        });
      }
    });
  }

  if (saveCloudBtn) {
    saveCloudBtn.addEventListener("click", () => {
      if (!enhancedResult) return;
      saveCloudBtn.textContent = "Saving...";
      chrome.runtime.sendMessage(
        {
          action: "saveToCloudPrompt",
          originalText: rawPromptMemory || enhancedResult.slice(0, 100),
          enhancedText: enhancedResult,
          category: "Extension v2.1.3.2",
          tone: currentTone,
          score: calculateScore(enhancedResult),
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
  }

  if (openStudioBtn) {
    openStudioBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        action: "openInWebStudio",
        prompt: rawPromptMemory || enhancedResult,
        tone: currentTone,
      });
    });
  }
});
