document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const charCount = document.getElementById("char-count");
  const tokenEstimate = document.getElementById("token-estimate");
  const enhanceBtn = document.getElementById("enhance-btn");
  const btnText = document.getElementById("btn-text");
  const toastMsg = document.getElementById("toast-msg");
  const resultCard = document.getElementById("result-card");
  const resultBody = document.getElementById("result-body");
  const scoreBadge = document.getElementById("quality-score-badge");
  const loopBadge = document.getElementById("loop-telemetry-badge");
  const engineTag = document.getElementById("engine-tag");
  const copyBtn = document.getElementById("copy-btn");
  const useBtn = document.getElementById("use-btn");
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
  const panelEnhance = document.getElementById("panel-enhance");
  const panelLibrary = document.getElementById("panel-library");
  const panelContext = document.getElementById("panel-context");
  const libraryGrid = document.getElementById("library-grid");
  const libSearch = document.getElementById("lib-search");
  const contextVaultList = document.getElementById("context-vault-list");

  let currentMode = "api";
  let currentTone = "code";
  let enhancedResult = "";
  let isListening = false;
  let recognitionInstance = null;
  let userQuota = { remaining: 88, monthlyLimit: 100, usagePercentage: 12 };
  let cloudPrompts = [];
  let activeContextBlocks = ["Next.js 16 + Tailwind v4"];

  // Curated Blueprints (AIPRM & Prompt Genius Inspiration)
  const CURATED_TEMPLATES = [
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
      category: "Business",
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
  ];

  let activeBot = { name: "Universal AI", maxContext: 128000, color: "#6366f1" };

  // 1. Detect Active Chatbot in the User's Current Tab
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
          activeBotPill.textContent = `🟢 ${activeBot.name}`;
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
    [tabBtnEnhance, tabBtnLibrary, tabBtnContext].forEach((b) => b?.classList.remove("active"));
    [panelEnhance, panelLibrary, panelContext].forEach((p) => {
      if (p) p.style.display = "none";
    });

    if (tab === "enhance") {
      tabBtnEnhance?.classList.add("active");
      if (panelEnhance) panelEnhance.style.display = "flex";
    } else if (tab === "library") {
      tabBtnLibrary?.classList.add("active");
      if (panelLibrary) panelLibrary.style.display = "flex";
      renderLibrary();
    } else if (tab === "context") {
      tabBtnContext?.classList.add("active");
      if (panelContext) panelContext.style.display = "flex";
      renderContextVault();
    }
  }

  tabBtnEnhance?.addEventListener("click", () => switchTab("enhance"));
  tabBtnLibrary?.addEventListener("click", () => switchTab("library"));
  tabBtnContext?.addEventListener("click", () => switchTab("context"));

  // 3. Render Library (AIPRM Style)
  function renderLibrary(filterText = "") {
    if (!libraryGrid) return;
    const all = [...(cloudPrompts || []), ...CURATED_TEMPLATES];
    const filtered = filterText
      ? all.filter((t) => (t.title + t.category + (t.text || t.enhancedText || "")).toLowerCase().includes(filterText.toLowerCase()))
      : all;

    libraryGrid.innerHTML = filtered.map((item) => `
      <div class="template-card" data-prompt="${encodeURIComponent(item.enhancedText || item.text || item.originalText || "")}">
        <div class="template-title-row">
          <span class="template-title">${item.title || "Untitled Blueprint"}</span>
          <span class="template-cat-badge">${item.category || "General"}</span>
        </div>
        <div class="template-preview">${item.text || item.enhancedText || item.originalText || ""}</div>
      </div>
    `).join("");

    libraryGrid.querySelectorAll(".template-card").forEach((card) => {
      card.addEventListener("click", () => {
        const text = decodeURIComponent(card.getAttribute("data-prompt") || "");
        if (input) {
          input.value = text;
          switchTab("enhance");
          input.dispatchEvent(new Event("input"));
          showToast("✓ Template loaded into Optimizer!");
        }
      });
    });
  }

  if (libSearch) {
    libSearch.addEventListener("input", () => {
      renderLibrary(libSearch.value.trim());
    });
  }

  // 4. Render Context Vault
  function renderContextVault() {
    if (!contextVaultList) return;
    const defaults = [
      { id: "nextjs", name: "Next.js 16 + Tailwind CSS v4", desc: "Production React 19 rules & responsive styling" },
      { id: "python", name: "Python FastAPI Architecture", desc: "Strict typing, Pydantic v2, and async DB patterns" },
      { id: "exec", name: "Executive Strategic Tone", desc: "Zero conversational fluff, bulleted takeaways & KPI focus" },
    ];

    contextVaultList.innerHTML = defaults.map((item) => `
      <div style="background: rgba(18,18,23,0.7); border: 1px solid rgba(255,255,255,0.08); padding: 9px 12px; border-radius: 9px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-weight: 700; font-size: 11.5px; color: #fff;">${item.name}</div>
          <div style="font-size: 10px; color: #a1a1aa;">${item.desc}</div>
        </div>
        <input type="checkbox" checked style="accent-color: #6366f1; cursor: pointer;" />
      </div>
    `).join("");
  }

  // 5. Tone Pill Handlers
  document.querySelectorAll(".tone-pill-btn").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".tone-pill-btn").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentTone = pill.getAttribute("data-tone") || "code";
    });
  });

  // 6. Bi-Directional Web Account Sync
  async function syncWithWebPlatform() {
    try {
      const authData = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "syncAuth" }, (res) => resolve(res));
      });

      if (authData?.authenticated && authData.user) {
        if (userName) userName.textContent = authData.user.name.split(" ")[0] || "User";
        if (userAvatar && authData.user.avatar) userAvatar.src = authData.user.avatar;
        if (syncStatusText) syncStatusText.textContent = "Web Synced";
        if (syncDot) syncDot.style.background = "#10b981";

        if (Array.isArray(authData.recentPrompts)) {
          cloudPrompts = authData.recentPrompts;
        }

        // Update Quota Bar
        if (authData.quota) {
          userQuota = authData.quota;
          const { remaining, monthlyLimit, usagePercentage } = authData.quota;
          if (tokenRemainingBadge) {
            tokenRemainingBadge.textContent = `${remaining} / ${monthlyLimit} Free Units`;
            if (remaining < 15) {
              tokenRemainingBadge.style.color = "#ef4444";
              tokenRemainingBadge.style.borderColor = "rgba(239, 68, 68, 0.4)";
              tokenRemainingBadge.style.background = "rgba(239, 68, 68, 0.12)";
            }
          }
          if (tokenMeterFill) {
            const fillPct = Math.max(8, Math.min(100, 100 - usagePercentage));
            tokenMeterFill.style.width = `${fillPct}%`;
            if (remaining < 15) {
              tokenMeterFill.style.background = "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)";
            }
          }
        }
      } else {
        if (syncStatusText) syncStatusText.textContent = "Local Mode";
        if (syncDot) syncDot.style.background = "#a1a1aa";
      }
    } catch {
      // Sync failover
    }
  }
  syncWithWebPlatform();

  // 7. Real-Time Token Calculation
  function updateTokenMetrics() {
    const raw = input ? input.value : "";
    const len = raw.length;
    const estTokens = Math.ceil(len / 3.8);
    const availableContext = Math.max(0, activeBot.maxContext - estTokens);
    const availableK = (availableContext / 1000).toFixed(1);

    if (charCount) charCount.textContent = `${len} char${len === 1 ? "" : "s"}`;
    if (tokenEstimate) tokenEstimate.textContent = `~${estTokens} Tokens`;
    if (tokenNeededTxt) tokenNeededTxt.textContent = `⚡ ~${estTokens} tok needed`;
    if (contextCapacityTxt) {
      contextCapacityTxt.textContent = `${availableK}K free in ${activeBot.name.split(" ")[0]}`;
    }

    if (tokenMeterFill && userQuota) {
      const dynamicRemaining = Math.max(0, userQuota.remaining - (estTokens > 50 ? 1 : 0));
      const fillPct = Math.max(8, Math.min(100, Math.round((dynamicRemaining / (userQuota.monthlyLimit || 100)) * 100)));
      tokenMeterFill.style.width = `${fillPct}%`;
    }
  }

  if (input) {
    input.addEventListener("input", updateTokenMetrics);
  }

  // 8. Segmented Mode Switcher
  function setMode(mode) {
    currentMode = mode;
    if (modeApi) modeApi.classList.remove("active");
    if (modeAlgo) modeAlgo.classList.remove("active");
    if (modeDevice) modeDevice.classList.remove("active");

    if (mode === "api") {
      if (modeApi) modeApi.classList.add("active");
    } else if (mode === "algo") {
      if (modeAlgo) modeAlgo.classList.add("active");
    } else {
      if (modeDevice) modeDevice.classList.add("active");
    }
  }

  if (modeApi) modeApi.addEventListener("click", () => setMode("api"));
  if (modeAlgo) modeAlgo.addEventListener("click", () => setMode("algo"));
  if (modeDevice) modeDevice.addEventListener("click", () => setMode("device"));

  // 9. Voice Dictation
  if (voiceBtn) {
    voiceBtn.addEventListener("click", async () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast("Speech recognition not supported in this browser.", true);
        return;
      }

      if (isListening) {
        if (recognitionInstance) {
          try { recognitionInstance.stop(); } catch {}
        }
        isListening = false;
        voiceBtn.classList.remove("recording");
        voiceBtn.innerHTML = "<span>🎙️ Voice Input</span>";
        return;
      }

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onstart = () => {
          isListening = true;
          voiceBtn.classList.add("recording");
          voiceBtn.innerHTML = "<span>🔴 Listening...</span>";
          showToast("🎙️ Listening... Speak your prompt idea.");
        };

        rec.onresult = (event) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript && input) {
            input.value = (input.value ? input.value + " " : "") + finalTranscript;
            input.dispatchEvent(new Event("input"));
          }
        };

        rec.onerror = () => {
          isListening = false;
          voiceBtn.classList.remove("recording");
          voiceBtn.innerHTML = "<span>🎙️ Voice Input</span>";
        };

        rec.onend = () => {
          isListening = false;
          voiceBtn.classList.remove("recording");
          voiceBtn.innerHTML = "<span>🎙️ Voice Input</span>";
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
    }, 4000);
  }

  function calculateScore(text) {
    if (!text) return 0;
    let score = 75;
    if (text.includes("### ROLE") || text.includes("### Persona")) score += 10;
    if (text.includes("### SPECIFICATIONS") || text.includes("### Context")) score += 8;
    if (text.includes("### EXECUTION") || text.includes("### Output Format")) score += 6;
    return Math.min(99, score);
  }

  const TYPO_REPLACEMENTS = {
    imrpove: "improve", improev: "improve", ehance: "enhance", enhace: "enhance",
    respons: "response", systemm: "system", systeam: "system", scrpaer: "scraper",
    functon: "function", compnent: "component", reac: "react", typocrift: "typescript",
    pyton: "python", tailwid: "tailwind", databse: "database", endpoin: "endpoint",
    secutiy: "security", framwork: "framework", copywritng: "copywriting",
  };

  function normalizeExtensionTypos(text) {
    if (!text) return text;
    return text.replace(/\b[a-zA-Z]+\b/g, (match) => {
      const lower = match.toLowerCase();
      const rep = TYPO_REPLACEMENTS[lower];
      if (rep) {
        if (match === match.toUpperCase()) return rep.toUpperCase();
        if (match[0] === match[0].toUpperCase()) return rep.charAt(0).toUpperCase() + rep.slice(1);
        return rep;
      }
      return match;
    });
  }

  function synthesizeLocalPrompt(userInput) {
    const text = normalizeExtensionTypos((userInput || "").trim());
    if (!text) return "";
    const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix|generate|make)\s+/i, "");
    const subject = cleanInput.length > 0 ? cleanInput : text;

    let role = "Principal Technical Architect & Systems Engineer";
    let toneStr = "Technically Rigorous, Production-Ready";
    let sec1 = "SPECIFICATIONS & ARCHITECTURE";
    let sec2 = "IMPLEMENTATION PROTOCOL";

    if (currentTone === "copy") {
      role = "Elite Conversion Copywriter & Brand Strategist";
      toneStr = "High-Conversion, Punchy & Action-Oriented";
      sec1 = "AUDIENCE HOOK & VALUE DIRECTIVES";
      sec2 = "NARRATIVE EXECUTION STEPS";
    } else if (currentTone === "exec") {
      role = "Senior Management Consultant & Executive Director";
      toneStr = "Concise, Strategic & Metric-Driven";
      sec1 = "STRATEGIC OBJECTIVES & CONSTRAINTS";
      sec2 = "ACTIONABLE ROADMAP & DECISION STEPS";
    } else if (currentTone === "deep") {
      role = "Lead AI Research Scientist & Deep Logic Reasoner";
      toneStr = "Exhaustive, First-Principles Reasoning";
      sec1 = "CORE HYPOTHESES & LOGICAL CONSTRAINTS";
      sec2 = "STEP-BY-STEP DEDUCTION & VALIDATION";
    }

    return `### ROLE & PERSONA
You are an authoritative ${role}. Execute this task with highest precision:
"${text}"

### ${sec1}
- **Subject**: "${subject}"
- **Tone Profile**: ${toneStr}
- **Active Project Context**: ${activeContextBlocks.join(", ")}
- **Constraints**: Deliver complete, production-grade output without omissions, placeholders, or conversational fluff.

### ${sec2}
1. Analyze the core requirements for "${subject}" and anticipate implicit edge cases.
2. Structure output with modular sections, scannable headers, and concrete code/examples.
3. Validate solution against security, scalability, and efficiency best practices.

### DELIVERABLES & OUTPUT FORMAT
- Deliver immediately usable, clean Markdown formatted content.`;
  }

  // 10. Enhance Action Handler
  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", async () => {
      const rawText = input ? input.value.trim() : "";
      if (!rawText) {
        showToast("Please type a prompt idea first!", true);
        if (input) input.focus();
        return;
      }

      enhanceBtn.disabled = true;
      if (btnText) btnText.textContent = "⚡ Compiling Master Prompt...";
      if (resultCard) resultCard.style.display = "flex";
      if (resultBody) resultBody.textContent = "Compiling with Prompt+ Intelligence...";

      let finalResult = "";
      let sourceTag = "Cloud AI";

      // If mode is "algo" (No-API Engine) -> use offline local rule engine
      if (currentMode === "algo") {
        finalResult = synthesizeLocalPrompt(rawText);
        sourceTag = "⚡ No-API Engine";
      }

      // If mode is "device" -> try On-Device Gemini Nano
      if (!finalResult && currentMode === "device") {
        try {
          const w = window;
          const lm = w.LanguageModel || w.ai?.languageModel;
          if (lm && (await lm.availability()) !== "unavailable") {
            const session = await lm.create({ temperature: 0.1, topK: 1 });
            const promptText = `Transform into a structured Master Prompt with Role, Specs, and Steps:\n\n"${rawText}"`;
            finalResult = await session.prompt(promptText);
            session.destroy();
            sourceTag = "🧠 On-Device Gemini Nano";
          }
        } catch {}
      }

      // API Mode or Fallback -> Call Background Message Router
      if (!finalResult) {
        try {
          const res = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              { action: "enhancePrompt", text: rawText, mode: currentMode, level: currentTone },
              (r) => resolve(r)
            );
          });

          if (res?.success && res.data?.enhanced) {
            finalResult = res.data.enhanced;
            sourceTag = `☁️ API Cloud (${res.data.model || "Auto"})`;
          }
        } catch {}
      }

      // Fail-Safe Synthesizer
      if (!finalResult) {
        finalResult = synthesizeLocalPrompt(rawText);
        sourceTag = "⚡ No-API Engine";
      }

      enhanceBtn.disabled = false;
      if (btnText) btnText.textContent = "⚡ Compile Master Prompt";

      enhancedResult = finalResult;
      if (resultBody) resultBody.textContent = enhancedResult;
      if (scoreBadge) {
        const qScore = calculateScore(enhancedResult);
        scoreBadge.textContent = `Score: ${qScore}/100`;
      }
      if (loopBadge) {
        loopBadge.textContent = `⚡ Loop: <30ms`;
      }
      if (engineTag) {
        engineTag.textContent = sourceTag;
      }
      if (copyBtn) copyBtn.disabled = false;
      if (useBtn) useBtn.disabled = false;
      showToast(`✓ Master prompt compiled!`);

      // Scroll smoothly to the result
      if (resultCard) {
        resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  // 11. Copy Button
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (enhancedResult) {
        navigator.clipboard.writeText(enhancedResult);
        copyBtn.textContent = "✓ Copied!";
        setTimeout(() => { copyBtn.textContent = "📋 Copy Prompt"; }, 2000);
      }
    });
  }

  // 12. Use in Active Tab
  if (useBtn) {
    useBtn.addEventListener("click", () => {
      if (enhancedResult) {
        chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs?.[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "injectEnhanced", enhanced: enhancedResult }, (r) => {
              if (r?.success) {
                useBtn.textContent = "✓ Injected";
                setTimeout(() => { useBtn.textContent = "🚀 Use in Active Tab"; }, 2000);
              } else {
                showToast("Open ChatGPT / Claude / Gemini to inject directly!", true);
              }
            });
          }
        });
      }
    });
  }

  // 13. Multi-AI Split Launch Handlers
  const openTargetAI = (targetUrl) => {
    try {
      chrome.tabs?.create({ url: targetUrl });
    } catch {
      window.open(targetUrl, "_blank");
    }
  };

  document.getElementById("bridge-chatgpt")?.addEventListener("click", () => openTargetAI("https://chatgpt.com/"));
  document.getElementById("bridge-claude")?.addEventListener("click", () => openTargetAI("https://claude.ai/new"));
  document.getElementById("bridge-gemini")?.addEventListener("click", () => openTargetAI("https://gemini.google.com/app"));
  document.getElementById("bridge-deepseek")?.addEventListener("click", () => openTargetAI("https://chat.deepseek.com/"));
});
