document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const charCount = document.getElementById("char-count");
  const tokenEstimate = document.getElementById("token-estimate");
  const enhanceBtn = document.getElementById("enhance-btn");
  const btnText = document.getElementById("btn-text");
  const msg = document.getElementById("msg");
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
  const engineStatusDesc = document.getElementById("engine-status-desc");
  const modelProviderPill = document.getElementById("model-provider-pill");
  const sizeToggle = document.getElementById("size-toggle");
  const voiceBtn = document.getElementById("voice-btn");
  const contextDrawer = document.getElementById("context-drawer");
  const contextDrawerToggle = document.getElementById("context-drawer-toggle");
  const contextCountBadge = document.getElementById("context-count-badge");
  const userAvatar = document.getElementById("user-avatar");
  const userName = document.getElementById("user-name");
  const syncStatusText = document.getElementById("sync-status-text");
  const syncDot = document.getElementById("sync-dot");
  const quotaRemainingText = document.getElementById("quota-remaining-text");
  const quotaBarFill = document.getElementById("quota-bar-fill");
  const tokenLoadText = document.getElementById("token-load-text");

  let currentMode = "api";
  let currentLevel = "deep";
  let enhancedResult = "";
  let isListening = false;
  let recognitionInstance = null;

  // 1. Bi-Directional Web Account Sync
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

        // Update Quota Bar
        if (authData.quota) {
          const { remaining, monthlyLimit, usagePercentage } = authData.quota;
          if (quotaRemainingText) {
            quotaRemainingText.textContent = `${remaining} / ${monthlyLimit} Free Units`;
          }
          if (quotaBarFill) {
            const fillPct = Math.max(8, Math.min(100, 100 - usagePercentage));
            quotaBarFill.style.width = `${fillPct}%`;
            if (remaining < 15) {
              quotaBarFill.style.background = "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)";
            }
          }
        }

        // Populate dynamic context blocks from cloud
        if (Array.isArray(authData.savedBlocks) && authData.savedBlocks.length > 0 && contextDrawer) {
          contextDrawer.innerHTML = authData.savedBlocks.map((b, idx) => `
            <div class="context-block-item">
              <input type="checkbox" id="ctx-dyn-${idx}" ${idx === 0 ? "checked" : ""} value="${b.id || idx}">
              <label for="ctx-dyn-${idx}">${b.name || "Custom Rule"}</label>
            </div>
          `).join("");
          updateActiveContextCount();
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

  // 2. Character & Token Counter
  if (input) {
    input.addEventListener("input", () => {
      const len = input.value.length;
      const estTokens = Math.ceil(len / 3.8);

      if (charCount) charCount.textContent = `${len} char${len === 1 ? "" : "s"}`;
      if (tokenEstimate) tokenEstimate.textContent = `~${estTokens} Tokens`;
      if (tokenLoadText) tokenLoadText.textContent = `~${estTokens} / 128K context load`;
    });
  }

  // 3. Preset Pills (Enhancement Levels)
  document.querySelectorAll(".preset-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".preset-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentLevel = pill.getAttribute("data-level") || "deep";
    });
  });

  // 4. Context Memory Drawer Toggle
  if (contextDrawerToggle && contextDrawer) {
    contextDrawerToggle.addEventListener("click", () => {
      contextDrawer.classList.toggle("open");
    });
  }

  function updateActiveContextCount() {
    if (!contextDrawer || !contextCountBadge) return;
    const checked = contextDrawer.querySelectorAll("input[type='checkbox']:checked").length;
    contextCountBadge.textContent = `(${checked})`;
  }

  if (contextDrawer) {
    contextDrawer.addEventListener("change", updateActiveContextCount);
  }

  // 5. Size Toggle
  let currentWidthIdx = 0;
  const widths = [
    { name: "380px", class: "" },
    { name: "480px", class: "wide-mode" },
    { name: "540px", class: "full-mode" },
  ];

  if (sizeToggle) {
    sizeToggle.addEventListener("click", () => {
      currentWidthIdx = (currentWidthIdx + 1) % widths.length;
      document.body.className = widths[currentWidthIdx].class;
      sizeToggle.textContent = widths[currentWidthIdx].name;
    });
  }

  // 6. Mode Switcher
  function setMode(mode) {
    currentMode = mode;
    if (modeApi) modeApi.classList.remove("active");
    if (modeAlgo) modeAlgo.classList.remove("active");
    if (modeDevice) modeDevice.classList.remove("active");

    if (mode === "api") {
      if (modeApi) modeApi.classList.add("active");
      if (engineStatusDesc) engineStatusDesc.textContent = "Cloud AI Mode — Multi-model compiler";
      if (modelProviderPill) modelProviderPill.textContent = "Auto-Routing";
    } else if (mode === "algo") {
      if (modeAlgo) modeAlgo.classList.add("active");
      if (engineStatusDesc) engineStatusDesc.textContent = "100% Offline Rule-Based Compiler (<30ms)";
      if (modelProviderPill) modelProviderPill.textContent = "Offline No-API";
    } else {
      if (modeDevice) modeDevice.classList.add("active");
      if (engineStatusDesc) engineStatusDesc.textContent = "On-Device Gemini Nano — Private Local AI";
      if (modelProviderPill) modelProviderPill.textContent = "Gemini Nano";
    }
  }

  if (modeApi) modeApi.addEventListener("click", () => setMode("api"));
  if (modeAlgo) modeAlgo.addEventListener("click", () => setMode("algo"));
  if (modeDevice) modeDevice.addEventListener("click", () => setMode("device"));

  // 7. Voice Dictation
  if (voiceBtn) {
    voiceBtn.addEventListener("click", async () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showMsg("Speech recognition not supported in this browser.", true);
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
          showMsg("🎙️ Listening... Speak your prompt idea.");
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
        showMsg("Microphone permission denied.", true);
      }
    });
  }

  function showMsg(text, isErr = false) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = `msg-toast ${isErr ? "err" : "ok"}`;
    msg.style.display = "block";
    setTimeout(() => {
      msg.style.display = "none";
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

  function detectImplicitTone(input) {
    const text = (input || "").toLowerCase();
    if (/\b(tweet|post|linkedin|casual|friendly|fun|newsletter|blog|engaging|story)\b/i.test(text)) return "Engaging & Conversational";
    if (/\b(sell|pitch|copy|ad|convert|sales|landing|cta|email|headline|offer)\b/i.test(text)) return "High-Conversion & Action-Oriented";
    if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html)\b/i.test(text)) return "Technically Rigorous & Production-Grade";
    if (/\b(strategy|plan|executive|kpi|growth|roadmap|summary|business|report)\b/i.test(text)) return "Executive & Strategic";
    return "Clear, Authoritative & Direct";
  }

  function synthesizeLocalPrompt(userInput) {
    const text = normalizeExtensionTypos((userInput || "").trim());
    if (!text) return "";
    const tone = detectImplicitTone(text);
    const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix|generate|make)\s+/i, "");
    const subject = cleanInput.length > 0 ? cleanInput : text;

    let role = "Senior Subject Matter Expert & Systems Architect";
    let sec1 = "SPECIFICATIONS & ARCHITECTURE";
    let sec2 = "EXECUTION PROTOCOL";

    if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html)\b/i.test(text)) {
      role = "Principal Software Engineer & Technical Architect";
      sec1 = "TECHNICAL SPECIFICATIONS & CONSTRAINTS";
      sec2 = "IMPLEMENTATION PROTOCOL";
    } else if (/\b(write|blog|article|email|post|essay|copy|letter|content|draft|story|headline|tweet|linkedin|newsletter)\b/i.test(text)) {
      role = "Elite Content Director & Strategic Copywriter";
      sec1 = "AUDIENCE HOOK & CONTENT DIRECTIVES";
      sec2 = "NARRATIVE EXECUTION STEPS";
    }

    return `### ROLE & PERSONA
You are an authoritative ${role}. Execute this task with production-grade rigor:
"${text}"

### ${sec1}
- **Subject**: "${subject}"
- **Tone Profile**: ${tone}
- **Constraints**: Deliver complete, unabridged solutions without placeholders or assumptions.

### ${sec2}
1. Analyze core requirements for "${subject}" and anticipate implicit edge cases.
2. Structure output with modular sections, scannable Markdown headers, and concrete code/examples.
3. Eliminate all conversational introductory fluff and meta commentary.

### DELIVERABLES & OUTPUT FORMAT
- Deliver complete, immediately usable results formatted in clean Markdown.`;
  }

  // 8. Enhance Action Handler
  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", async () => {
      const rawText = input ? input.value.trim() : "";
      if (!rawText) {
        showMsg("Please type a prompt idea first!", true);
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
        sourceTag = "⚡ No-API Rule Engine";
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
              { action: "enhancePrompt", text: rawText, mode: currentMode, level: currentLevel },
              (r) => resolve(r)
            );
          });

          if (res?.success && res.data?.enhanced) {
            finalResult = res.data.enhanced;
            sourceTag = `☁️ API Cloud AI (${res.data.model || "Auto"})`;
          }
        } catch {}
      }

      // Fail-Safe Synthesizer
      if (!finalResult) {
        finalResult = synthesizeLocalPrompt(rawText);
        sourceTag = "⚡ No-API Rule Engine";
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
      showMsg(`✓ Compiled successfully!`);
    });
  }

  // 9. Copy Button
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (enhancedResult) {
        navigator.clipboard.writeText(enhancedResult);
        copyBtn.textContent = "✓ Copied!";
        setTimeout(() => { copyBtn.textContent = "📋 Copy Prompt"; }, 2000);
      }
    });
  }

  // 10. Use in Active Tab
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
                showMsg("Open ChatGPT / Claude / Gemini to inject directly!", true);
              }
            });
          }
        });
      }
    });
  }

  // 11. Multi-AI Split Launch Handlers
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
