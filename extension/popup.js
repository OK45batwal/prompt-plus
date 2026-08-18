document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const charCount = document.getElementById("char-count");
  const enhanceBtn = document.getElementById("enhance-btn");
  const btnText = document.getElementById("btn-text");
  const msg = document.getElementById("msg");
  const resultCard = document.getElementById("result-card");
  const resultBody = document.getElementById("result-body");
  const scoreBadge = document.getElementById("quality-score-badge");
  const copyBtn = document.getElementById("copy-btn");
  const useBtn = document.getElementById("use-btn");
  const modeApi = document.getElementById("mode-api");
  const modeAlgo = document.getElementById("mode-algo");
  const modeDevice = document.getElementById("mode-device");
  const modeLabel = document.getElementById("mode-label");
  const sizeToggle = document.getElementById("size-toggle");
  const sizeText = document.getElementById("size-text");

  let currentMode = "api";
  let enhancedResult = "";

  // 1. Character Counter
  if (input) {
    input.addEventListener("input", () => {
      const len = input.value.length;
      if (charCount) charCount.textContent = `${len} character${len === 1 ? "" : "s"}`;
    });
  }

  // 2. Preset Pills
  document.querySelectorAll(".preset-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".preset-pill").forEach((p) => {
        p.classList.remove("active");
        p.style.background = "rgba(255,255,255,0.04)";
        p.style.borderColor = "rgba(255,255,255,0.1)";
        p.style.color = "#a1a1aa";
      });
      pill.classList.add("active");
      pill.style.background = "rgba(99,102,241,0.2)";
      pill.style.borderColor = "rgba(99,102,241,0.4)";
      pill.style.color = "#a5b4fc";
      selectedPreset = pill.getAttribute("data-preset") || "auto";
    });
  });

  // 3. Size Toggle
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
      if (sizeText) sizeText.textContent = widths[currentWidthIdx].name;
    });
  }

  // 4. Mode Switches
  function setMode(mode) {
    currentMode = mode;
    if (modeApi) modeApi.classList.remove("active");
    if (modeAlgo) modeAlgo.classList.remove("active");
    if (modeDevice) modeDevice.classList.remove("active");

    if (mode === "api") {
      if (modeApi) modeApi.classList.add("active");
      if (modeLabel) modeLabel.textContent = "🟢 API Cloud AI — Key or free fallback";
    } else if (mode === "algo") {
      if (modeAlgo) modeAlgo.classList.add("active");
      if (modeLabel) modeLabel.textContent = "⚡ No-API Rule Engine — 100% offline, zero key required";
    } else {
      if (modeDevice) modeDevice.classList.add("active");
      if (modeLabel) modeLabel.textContent = "🧠 On-Device Gemini Nano — private offline execution";
    }
  }

  if (modeApi) modeApi.addEventListener("click", () => setMode("api"));
  if (modeAlgo) modeAlgo.addEventListener("click", () => setMode("algo"));
  if (modeDevice) modeDevice.addEventListener("click", () => setMode("device"));

  function showMsg(text, isErr = false) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = `msg ${isErr ? "err" : "ok"}`;
    msg.style.display = "inline-flex";
    setTimeout(() => {
      msg.style.display = "none";
    }, 4000);
  }

  function calculateScore(text) {
    if (!text) return 0;
    let score = 70;
    if (text.includes("### Role") || text.includes("### Persona")) score += 10;
    if (text.includes("### Objective") || text.includes("### Context")) score += 10;
    if (text.includes("### Step-by-Step") || text.includes("### Output Format")) score += 8;
    return Math.min(99, score);
  }

  function detectImplicitTone(input) {
    const text = (input || "").toLowerCase();
    if (/\b(tweet|post|linkedin|casual|friendly|fun|newsletter|blog|engaging|story)\b/i.test(text)) return "Engaging, Authentic & Conversational";
    if (/\b(sell|pitch|copy|ad|convert|sales|landing|cta|email|headline|offer)\b/i.test(text)) return "High-Conversion, Persuasive & Action-Oriented";
    if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html)\b/i.test(text)) return "Technically Rigorous, Precise & Production-Grade";
    if (/\b(strategy|plan|executive|kpi|growth|roadmap|summary|business|report)\b/i.test(text)) return "Executive, Strategic & High-Level";
    if (/\b(data|analyze|analysis|statistics|metrics|research|paper|study)\b/i.test(text)) return "Analytical, Objective & Data-Driven";
    return "Clear, Authoritative & Direct";
  }

  function synthesizeLocalPrompt(userInput) {
    const text = (userInput || "").trim();
    if (!text) return "";
    const tone = detectImplicitTone(text);
    const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix|generate|make)\s+/i, "");
    const subject = cleanInput.length > 0 ? cleanInput : text;

    let role = "Senior Subject Matter Expert & Systems Architect";
    let domain = "Execution & Strategic Analysis";
    let sec1 = "Key Requirements & Specifications";
    let sec2 = "Execution Guidelines";
    let directives = [
      `Analyze core requirements for "${subject}" and address implicit edge cases.`,
      `Deliver an authoritative, highly structured solution matching tone profile ("${tone}").`,
      `Ensure output is ready for immediate deployment with zero conversational fluff.`
    ];

    if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html)\b/i.test(text)) {
      role = "Principal Software Engineer & Technical Architect";
      domain = "Production Software Engineering";
      sec1 = "Architecture & Technical Specifications";
      sec2 = "Implementation Guidelines";
      directives = [
        `Design a clean, modular, production-ready architecture for "${subject}".`,
        `Incorporate strict typing, comprehensive error handling, and performance optimizations.`,
        `Provide executable, self-contained code blocks with clear inline documentation.`
      ];
    } else if (/\b(write|blog|article|email|post|essay|copy|letter|content|draft|story|headline|tweet|linkedin|newsletter)\b/i.test(text)) {
      role = "Elite Content Director & Strategic Copywriter";
      domain = "High-Impact Copywriting & Editorial Strategy";
      sec1 = "Audience Hook & Narrative Strategy";
      sec2 = "Content Directives";
      directives = [
        `Craft an engaging narrative hook tailored to the target audience for "${subject}".`,
        `Maintain a ${tone.toLowerCase()} tone with scannable formatting, subheadings, and clear takeaways.`,
        `Eliminate passive voice, repetitive boilerplate, and generic introductory filler.`
      ];
    }

    return `You are a ${role} with deep expertise in ${domain}.

Your objective is to execute the following request with production-grade precision:
"${text}"

### ${sec1}
- **Target Subject**: "${subject}"
- **Tone & Persona**: ${tone}
- **Quality Standard**: Deliver complete, unabridged solutions without placeholders or assumptions.

### ${sec2}
1. ${directives[0]}
2. ${directives[1]}
3. ${directives[2]}

### Deliverables & Formatting Specs
- Present final response with clear Markdown headers, bulleted lists, and structured blocks ready for immediate real-world application.`;
  }

  async function enhanceWithDeviceInExtension(text) {
    if (!text) return null;
    try {
      const w = window;
      const lm = w.LanguageModel || w.ai?.languageModel;
      if (!lm) return null;
      const avail = await lm.availability();
      if (avail !== "available" && avail !== "readily") return null;
      const session = await lm.create({ temperature: 0.1, topK: 1 });
      const promptText = `You are a Senior Prompt Architect. Transform the following prompt into an advanced, structured master prompt with Role, Specifications, and Execution steps:\n\n"${text}"`;
      const res = await session.prompt(promptText);
      session.destroy();
      return res ? res.trim() : null;
    } catch {
      return null;
    }
  }

  // 5. Enhance Action
  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", async () => {
      const text = input ? input.value.trim() : "";
      if (!text) {
        showMsg("Please type a prompt first!", true);
        if (input) input.focus();
        return;
      }

      enhanceBtn.disabled = true;
      if (btnText) btnText.textContent = "Compiling Master Prompt...";
      if (resultCard) resultCard.style.display = "block";
      if (resultBody) resultBody.textContent = "Enhancing prompt with Prompt+ Intelligence...";

      let finalResult = "";
      let sourceLabel = "Cloud AI";

      // 1. If mode is "algo" (No-API Engine) -> use offline local rule engine
      if (currentMode === "algo") {
        finalResult = synthesizeLocalPrompt(text);
        sourceLabel = "No-API Rule Engine";
      }

      // 2. If mode is "device" -> try On-Device Gemini Nano
      if (!finalResult && currentMode === "device") {
        const deviceText = await enhanceWithDeviceInExtension(text);
        if (deviceText) {
          finalResult = deviceText;
          sourceLabel = "On-Device Gemini Nano";
        }
      }

      // 3. API Mode or Fallback -> Call Cloud API (uses key if present, or free tier/algo fallback)
      if (!finalResult) {
        try {
          const res = await new Promise((resolve) => {
            try {
              chrome.runtime.sendMessage(
                { action: "enhancePrompt", text, mode: currentMode },
                (r) => resolve(r)
              );
            } catch {
              resolve(null);
            }
          });

          if (res?.success && res.data?.enhanced) {
            finalResult = res.data.enhanced;
            sourceLabel = "API Cloud AI";
          }
        } catch {
          // Cloud failover
        }
      }

      // 4. Ultimate Fail-safe: Local Synthesizer (Zero-Failure Guarantee)
      if (!finalResult) {
        finalResult = synthesizeLocalPrompt(text);
        sourceLabel = "No-API Fail-Safe Engine";
      }

      enhanceBtn.disabled = false;
      if (btnText) btnText.textContent = "⚡ Enhance Prompt Live";

      enhancedResult = finalResult;
      if (resultBody) resultBody.textContent = enhancedResult;
      if (scoreBadge) {
        const qScore = calculateScore(enhancedResult);
        scoreBadge.textContent = `Score: ${qScore}/100`;
      }
      if (copyBtn) copyBtn.disabled = false;
      if (useBtn) useBtn.disabled = false;
      showMsg(`✓ Enhanced via ${sourceLabel}!`);
    });
  }

  // 6. Copy Button
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (enhancedResult) {
        navigator.clipboard.writeText(enhancedResult);
        copyBtn.textContent = "✓ Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
      }
    });
  }

  // 7. Use in Active Tab
  if (useBtn) {
    useBtn.addEventListener("click", () => {
      if (enhancedResult) {
        chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs?.[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "injectEnhanced", enhanced: enhancedResult }, (r) => {
              if (r?.success) {
                useBtn.textContent = "✓ Injected";
                setTimeout(() => { useBtn.textContent = "Use in Tab →"; }, 2000);
              } else {
                showMsg("Open an AI chat tab (ChatGPT / Claude) to inject!", true);
              }
            });
          }
        });
      }
    });
  }

  // 8. Cross-AI Context Bridge Handlers
  const openTargetAI = (targetUrl) => {
    try {
      chrome.tabs?.create({ url: targetUrl });
    } catch {
      window.open(targetUrl, "_blank");
    }
  };

  document.getElementById("bridge-claude")?.addEventListener("click", () => openTargetAI("https://claude.ai/new"));
  document.getElementById("bridge-gemini")?.addEventListener("click", () => openTargetAI("https://gemini.google.com/app"));
  document.getElementById("bridge-chatgpt")?.addEventListener("click", () => openTargetAI("https://chatgpt.com/"));
  document.getElementById("bridge-deepseek")?.addEventListener("click", () => openTargetAI("https://chat.deepseek.com/"));
});
