import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const OUT_DIR = path.resolve("promo-screenshots");
const PUBLIC_DIR = path.resolve("public/screenshots");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Common SVG design tokens
const WIDTH = 1280;
const HEIGHT = 800;

function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function baseLayout({ badge, headline, subheadline, contentSvg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <!-- Gradients -->
    <radialGradient id="bgGlow" cx="50%" cy="0%" r="85%">
      <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.65"/>
      <stop offset="50%" stop-color="#09090b" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="purpleAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#a5b4fc"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <linearGradient id="telemetryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <!-- Window Border Gradient -->
    <linearGradient id="windowBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.2)"/>
      <stop offset="50%" stop-color="rgba(99,102,241,0.3)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.08)"/>
    </linearGradient>

    <!-- Grid Pattern -->
    <pattern id="gridDots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#ffffff" fill-opacity="0.05"/>
    </pattern>

    <!-- Drop Shadows -->
    <filter id="windowShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.8"/>
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#6366f1" flood-opacity="0.2"/>
    </filter>
    <filter id="pillShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#6366f1" flood-opacity="0.35"/>
    </filter>
  </defs>

  <style>
    .font-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif; font-weight: 800; }
    .font-body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", sans-serif; }
    .font-mono { font-family: "SF Mono", "Fira Code", Menlo, monospace; }
  </style>

  <!-- Background Base -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#09090b"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGlow)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#gridDots)"/>
  <circle cx="640" cy="500" r="450" fill="url(#purpleAura)"/>

  <!-- Top Marketing Header -->
  <g transform="translate(640, 56)" text-anchor="middle">
    <!-- Category Pill Badge -->
    <rect x="-110" y="0" width="220" height="26" rx="13" fill="rgba(99, 102, 241, 0.12)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1"/>
    <text x="0" y="17" class="font-title" font-size="10.5" fill="#a5b4fc" letter-spacing="1.5">${escapeXml(badge)}</text>

    <!-- Main Headline -->
    <text x="0" y="60" class="font-title" font-size="33" fill="url(#textGrad)" letter-spacing="-0.5">${escapeXml(headline)}</text>

    <!-- Subheadline -->
    <text x="0" y="88" class="font-body" font-size="14.5" fill="#94a3b8" letter-spacing="-0.2">${escapeXml(subheadline)}</text>
  </g>

  <!-- Illustration Viewport (Y: 170 to 760) -->
  <g id="main-content">
    ${contentSvg}
  </g>
</svg>`;
}

// -------------------------------------------------------------
// SCREENSHOT 1: 1-Click In-Page Prompt Optimizer
// -------------------------------------------------------------
const s1Content = `
  <!-- Browser Frame -->
  <g transform="translate(110, 166)" filter="url(#windowShadow)">
    <rect width="1060" height="580" rx="16" fill="#0d0e15" stroke="url(#windowBorder)" stroke-width="1"/>

    <!-- Mac Window Bar -->
    <rect width="1060" height="42" rx="16" fill="#14151f"/>
    <rect y="36" width="1060" height="6" fill="#14151f"/>
    <circle cx="24" cy="21" r="5.5" fill="#ef4444"/>
    <circle cx="42" cy="21" r="5.5" fill="#eab308"/>
    <circle cx="60" cy="21" r="5.5" fill="#22c55e"/>

    <!-- Browser Address Capsule -->
    <rect x="360" y="9" width="340" height="24" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="530" y="25" text-anchor="middle" class="font-mono" font-size="11" fill="#94a3b8">chatgpt.com / claude.ai</text>

    <!-- Chat Message Container -->
    <!-- Bot Greeting -->
    <g transform="translate(50, 75)">
      <circle cx="16" cy="16" r="16" fill="#10a37f"/>
      <text x="16" y="21" text-anchor="middle" class="font-body" font-size="14" font-weight="bold" fill="#ffffff">AI</text>
      <rect x="46" y="2" width="460" height="40" rx="10" fill="rgba(255,255,255,0.04)"/>
      <text x="62" y="26" class="font-body" font-size="13" fill="#cbd5e1">What engineering challenge are we solving today?</text>
    </g>

    <!-- Raw Prompt Input Box -->
    <g transform="translate(50, 150)">
      <rect width="960" height="110" rx="14" fill="rgba(0,0,0,0.5)" stroke="rgba(99,102,241,0.35)" stroke-width="1.5"/>
      <text x="20" y="32" class="font-mono" font-size="13" fill="#e2e8f0">build a resilient payment webhook handler with stripe, postgres, and nextjs</text>
      <text x="20" y="55" class="font-mono" font-size="12" fill="#64748b">make sure it handles idempotency and replay attacks</text>

      <!-- Bottom Chat Controls -->
      <text x="20" y="94" class="font-body" font-size="11" fill="#475569">Shift + Return to add a new line</text>
      <circle cx="935" cy="85" r="14" fill="rgba(255,255,255,0.1)"/>
      <path d="M935 77 L935 91 M930 83 L935 77 L940 83" stroke="#94a3b8" stroke-width="2" fill="none" stroke-linecap="round"/>

      <!-- NEW PROMPT+ FLOATING POP BUTTON (Active Expanded) -->
      <g transform="translate(710, -18)" filter="url(#pillShadow)">
        <rect width="236" height="34" rx="17" fill="rgba(12,12,16,0.95)" stroke="rgba(99,102,241,0.6)" stroke-width="1.2"/>

        <!-- Sparkle Circle Icon -->
        <circle cx="17" cy="17" r="11" fill="url(#primaryGrad)"/>
        <path d="m17 11 -1 3.5 a1 1 0 0 1 -.7 .7 L11.8 16.2 a1 1 0 0 1 0 1.6 l3.5 1 a1 1 0 0 1 .7 .7 L17 23 l1 -3.5 a1 1 0 0 1 .7 -.7 l3.5 -1 a1 1 0 0 1 0 -1.6 l-3.5 -1 a1 1 0 0 1 -.7 -.7 Z" fill="#ffffff" transform="translate(0,-1) scale(0.9)"/>

        <!-- Enhance Label & Shortcut -->
        <text x="36" y="21" class="font-title" font-size="11.5" fill="#ffffff">Enhance</text>
        <rect x="88" y="10" width="26" height="15" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>
        <text x="101" y="21" text-anchor="middle" class="font-body" font-size="9" font-weight="bold" fill="#a1a1aa">⌘↵</text>

        <!-- Divider -->
        <line x1="122" y1="10" x2="122" y2="24" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>

        <!-- Token Telemetry Badge -->
        <rect x="130" y="9" width="80" height="16" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="0.8"/>
        <text x="170" y="21" text-anchor="middle" class="font-body" font-size="9.5" font-weight="600" fill="#a1a1aa">128K · ~18 tok</text>

        <!-- Chevron Launcher -->
        <path d="M218 19 L222 15 L226 19" fill="none" stroke="#a1a1aa" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    </g>

    <!-- Transformed Output Card (Below Input) -->
    <g transform="translate(50, 290)">
      <!-- Transformation Banner Indicator -->
      <rect width="960" height="255" rx="14" fill="rgba(16,18,27,0.9)" stroke="rgba(99,102,241,0.4)" stroke-width="1"/>

      <!-- Output Header Tag -->
      <rect x="20" y="16" width="168" height="24" rx="6" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.3)" stroke-width="1"/>
      <circle cx="32" cy="28" r="4" fill="#10b981"/>
      <text x="42" y="32" class="font-title" font-size="10.5" fill="#34d399">COMPILED MASTER PROMPT</text>

      <text x="200" y="32" class="font-body" font-size="11" fill="#94a3b8">Optimized in 12ms via Prompt+ Local Synthesis Engine</text>

      <!-- Markdown Output Display -->
      <g transform="translate(20, 52)" class="font-mono">
        <text x="0" y="16" font-size="11.5" fill="#818cf8" font-weight="bold">### ROLE &amp; PERSONA</text>
        <text x="0" y="34" font-size="11" fill="#e2e8f0">You are a Principal Distributed Systems &amp; FinTech Security Architect.</text>

        <text x="0" y="62" font-size="11.5" fill="#818cf8" font-weight="bold">### SPECIFICATIONS &amp; ARCHITECTURAL CONSTRAINTS</text>
        <text x="0" y="80" font-size="11" fill="#94a3b8">• Subject: Stripe Webhook Pipeline with PostgreSQL Idempotency</text>
        <text x="0" y="98" font-size="11" fill="#94a3b8">• Tone: Technically Rigorous, Production-Grade, Zero Robotic Buzzwords</text>
        <text x="0" y="116" font-size="11" fill="#94a3b8">• Security: Replay attack prevention via signature verification &amp; timestamp drift checks</text>

        <text x="0" y="144" font-size="11.5" fill="#818cf8" font-weight="bold">### IMPLEMENTATION PROTOCOL</text>
        <text x="0" y="162" font-size="11" fill="#e2e8f0">1. Raw-body validation using standard Web Crypto / Stripe SDK without intermediate parser corruption.</text>
        <text x="0" y="180" font-size="11" fill="#e2e8f0">2. Atomic SQL transaction with SELECT FOR UPDATE on event idempotency ledger table.</text>
      </g>
    </g>
  </g>
`;

// -------------------------------------------------------------
// SCREENSHOT 2: Prompt+ Studio Popover (5 Precision Personas)
// -------------------------------------------------------------
const s2Content = `
  <g transform="translate(110, 166)" filter="url(#windowShadow)">
    <rect width="1060" height="580" rx="16" fill="#0d0e15" stroke="url(#windowBorder)" stroke-width="1"/>

    <!-- Mac Window Bar -->
    <rect width="1060" height="42" rx="16" fill="#14151f"/>
    <circle cx="24" cy="21" r="5.5" fill="#ef4444"/>
    <circle cx="42" cy="21" r="5.5" fill="#eab308"/>
    <circle cx="60" cy="21" r="5.5" fill="#22c55e"/>
    <rect x="360" y="9" width="340" height="24" rx="6" fill="rgba(255,255,255,0.06)"/>
    <text x="530" y="25" text-anchor="middle" class="font-mono" font-size="11" fill="#94a3b8">claude.ai / chatgpt.com</text>

    <!-- Faded Background Chat Elements -->
    <rect x="60" y="440" width="940" height="90" rx="12" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.08)"/>
    <text x="80" y="480" class="font-body" font-size="13" fill="#475569">Type your raw prompt idea here...</text>

    <!-- PROMPT+ STUDIO MODAL (Centered Showcase) -->
    <g transform="translate(300, 70)" filter="url(#windowShadow)">
      <rect width="460" height="420" rx="16" fill="rgba(12,12,16,0.98)" stroke="rgba(99,102,241,0.5)" stroke-width="1.2"/>

      <!-- Modal Header -->
      <g transform="translate(20, 22)">
        <circle cx="11" cy="11" r="11" fill="url(#primaryGrad)"/>
        <path d="m11 6 -1 2.5 a1 1 0 0 1 -.6 .6 L6.9 10.1 a1 1 0 0 1 0 1.6 l2.5 1 a1 1 0 0 1 .6 .6 L11 16 l1 -2.5 a1 1 0 0 1 .6 -.6 l2.5 -1 a1 1 0 0 1 0 -1.6 l-2.5 -1 a1 1 0 0 1 -.6 -.6 Z" fill="#ffffff"/>
        <text x="32" y="15" class="font-title" font-size="14.5" fill="#ffffff">Prompt+ Studio</text>

        <!-- Model Badge -->
        <rect x="156" y="2" width="138" height="20" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <circle cx="166" cy="12" r="3" fill="#d97706"/>
        <text x="175" y="16" class="font-title" font-size="9.5" fill="#fbbf24">Claude 3.5 Sonnet</text>

        <!-- Close X -->
        <line x1="410" y1="6" x2="418" y2="14" stroke="#71717a" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="418" y1="6" x2="410" y2="14" stroke="#71717a" stroke-width="1.8" stroke-linecap="round"/>
      </g>

      <!-- Real-Time Telemetry Card -->
      <g transform="translate(20, 64)">
        <rect width="420" height="60" rx="10" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
        <text x="14" y="20" class="font-title" font-size="11" fill="#ffffff">Context Window Capacity</text>
        <rect x="250" y="9" width="156" height="18" rx="4" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.3)" stroke-width="1"/>
        <text x="328" y="22" text-anchor="middle" class="font-body" font-size="9.5" font-weight="bold" fill="#10b981">198.2K free (99.1%)</text>

        <!-- Progress Bar -->
        <rect x="14" y="33" width="392" height="5.5" rx="3" fill="rgba(255,255,255,0.08)"/>
        <rect x="14" y="33" width="370" height="5.5" rx="3" fill="url(#telemetryGrad)"/>

        <text x="14" y="51" class="font-body" font-size="9" fill="#71717a">Prompt Load: ~28 tokens</text>
        <text x="406" y="51" text-anchor="end" class="font-body" font-size="9" fill="#71717a">Max: 200K tokens</text>
      </g>

      <!-- 5 Precision Persona Chips (Zero Emojis, Pure Typography) -->
      <g transform="translate(20, 140)">
        <text x="0" y="0" class="font-title" font-size="10" fill="#71717a" letter-spacing="0.5">SELECT PERSONA ARCHITECTURE</text>

        <!-- Natural Human -->
        <rect x="0" y="10" width="90" height="26" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="45" y="27" text-anchor="middle" class="font-body" font-size="9.5" font-weight="600" fill="#cbd5e1">Natural Human</text>

        <!-- Tech Architect (Active) -->
        <rect x="96" y="10" width="94" height="26" rx="6" fill="rgba(99,102,241,0.25)" stroke="rgba(99,102,241,0.7)" stroke-width="1.2"/>
        <text x="143" y="27" text-anchor="middle" class="font-title" font-size="9.5" fill="#e0e7ff">Tech Architect</text>

        <!-- Conversion Copy -->
        <rect x="196" y="10" width="102" height="26" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="247" y="27" text-anchor="middle" class="font-body" font-size="9.5" font-weight="600" fill="#cbd5e1">Conversion Copy</text>

        <!-- Executive Brief -->
        <rect x="304" y="10" width="98" height="26" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="353" y="27" text-anchor="middle" class="font-body" font-size="9.5" font-weight="600" fill="#cbd5e1">Executive Brief</text>

        <!-- Deep Reasoner (Next line) -->
        <rect x="0" y="42" width="98" height="26" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="49" y="59" text-anchor="middle" class="font-body" font-size="9.5" font-weight="600" fill="#cbd5e1">Deep Reasoner</text>
      </g>

      <!-- Live Preview Area -->
      <g transform="translate(20, 222)">
        <rect width="420" height="116" rx="9" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
        <g class="font-mono" font-size="10.5">
          <text x="14" y="20" fill="#818cf8">&lt;role_and_objective&gt;</text>
          <text x="14" y="38" fill="#e2e8f0">  &lt;persona&gt;Senior Staff Distributed Systems Architect&lt;/persona&gt;</text>
          <text x="14" y="56" fill="#e2e8f0">  &lt;task&gt;Design fault-tolerant event streams with Kafka&lt;/task&gt;</text>
          <text x="14" y="74" fill="#818cf8">&lt;/role_and_objective&gt;</text>
          <text x="14" y="94" fill="#94a3b8">&lt;anti_cliche_mandate&gt;Zero preamble, direct execution&lt;/anti_cliche_mandate&gt;</text>
        </g>
      </g>

      <!-- Action Buttons -->
      <g transform="translate(20, 354)">
        <!-- Primary Action -->
        <rect width="310" height="42" rx="8" fill="url(#primaryGrad)"/>
        <polygon points="26,14 16,26 25,26 24,34 34,22 25,22" fill="#ffffff"/>
        <text x="135" y="26" class="font-title" font-size="12" fill="#ffffff">Optimize &amp; Replace in Chat</text>
        <rect x="252" y="12" width="34" height="18" rx="4" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <text x="269" y="25" text-anchor="middle" class="font-body" font-size="9.5" font-weight="bold" fill="#ffffff">⌘↵</text>

        <!-- Secondary Copy Button -->
        <rect x="320" y="0" width="100" height="42" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <rect x="340" y="14" width="12" height="12" rx="2" fill="none" stroke="#ffffff" stroke-width="1.6"/>
        <path d="M336 21 L336 11 A 2 2 0 0 1 338 9 L348 9" fill="none" stroke="#ffffff" stroke-width="1.6"/>
        <text x="360" y="26" class="font-title" font-size="12" fill="#ffffff">Copy</text>
      </g>
    </g>

    <!-- Side Highlights -->
    <g transform="translate(60, 160)">
      <rect width="180" height="90" rx="10" fill="rgba(20,20,30,0.8)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="16" y="24" class="font-title" font-size="11" fill="#a5b4fc">ANTI-CLICHÉ ENGINE</text>
      <text x="16" y="46" class="font-body" font-size="10.5" fill="#94a3b8">Bans generic AI slop:</text>
      <text x="16" y="64" class="font-mono" font-size="9.5" fill="#f87171">"delve into, tapestry..."</text>
    </g>

    <g transform="translate(820, 160)">
      <rect width="180" height="90" rx="10" fill="rgba(20,20,30,0.8)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="16" y="24" class="font-title" font-size="11" fill="#34d399">KEYBOARD FIRST</text>
      <text x="16" y="46" class="font-body" font-size="10.5" fill="#94a3b8">Press ⌘↵ to replace</text>
      <text x="16" y="64" class="font-body" font-size="10.5" fill="#94a3b8">Press Esc to dismiss</text>
    </g>
  </g>
`;

// -------------------------------------------------------------
// SCREENSHOT 3: Context Window Telemetry
// -------------------------------------------------------------
const s3Content = `
  <g transform="translate(110, 166)" filter="url(#windowShadow)">
    <rect width="1060" height="580" rx="16" fill="#0d0e15" stroke="url(#windowBorder)" stroke-width="1"/>

    <!-- Mac Window Bar -->
    <rect width="1060" height="42" rx="16" fill="#14151f"/>
    <circle cx="24" cy="21" r="5.5" fill="#ef4444"/>
    <circle cx="42" cy="21" r="5.5" fill="#eab308"/>
    <circle cx="60" cy="21" r="5.5" fill="#22c55e"/>
    <text x="530" y="26" text-anchor="middle" class="font-title" font-size="12" fill="#94a3b8">Prompt+ AI Context Matrix &amp; Token Architecture</text>

    <!-- Grid of 6 Model Architectures -->
    <g transform="translate(45, 65)">
      <!-- 1. Gemini -->
      <g transform="translate(0, 0)">
        <rect width="470" height="135" rx="12" fill="rgba(20,22,34,0.9)" stroke="rgba(59,130,246,0.4)" stroke-width="1.2"/>
        <circle cx="34" cy="34" r="14" fill="rgba(59,130,246,0.2)"/>
        <text x="34" y="39" text-anchor="middle" class="font-title" font-size="13" fill="#60a5fa">G</text>
        <text x="60" y="32" class="font-title" font-size="14" fill="#ffffff">Google Gemini 2.0 / 1.5</text>
        <text x="60" y="48" class="font-body" font-size="11" fill="#94a3b8">Multi-modal massive context window</text>

        <rect x="330" y="22" width="124" height="22" rx="4" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" stroke-width="1"/>
        <text x="392" y="37" text-anchor="middle" class="font-title" font-size="10" fill="#93c5fd">1,000,000 TOKENS</text>

        <rect x="20" y="70" width="430" height="6" rx="3" fill="rgba(255,255,255,0.06)"/>
        <rect x="20" y="70" width="418" height="6" rx="3" fill="#3b82f6"/>
        <text x="20" y="98" class="font-mono" font-size="10.5" fill="#64748b">Remaining: 988.4K tokens free (98.8%)</text>
        <text x="450" y="98" text-anchor="end" class="font-mono" font-size="10.5" fill="#10b981">Optimal Load</text>
      </g>

      <!-- 2. Claude 3.5 Sonnet -->
      <g transform="translate(495, 0)">
        <rect width="470" height="135" rx="12" fill="rgba(20,22,34,0.9)" stroke="rgba(217,119,6,0.4)" stroke-width="1.2"/>
        <circle cx="34" cy="34" r="14" fill="rgba(217,119,6,0.2)"/>
        <text x="34" y="39" text-anchor="middle" class="font-title" font-size="13" fill="#fbbf24">C</text>
        <text x="60" y="32" class="font-title" font-size="14" fill="#ffffff">Claude 3.5 Sonnet (Anthropic)</text>
        <text x="60" y="48" class="font-body" font-size="11" fill="#94a3b8">High-precision coding &amp; agentic reasoner</text>

        <rect x="346" y="22" width="108" height="22" rx="4" fill="rgba(217,119,6,0.15)" stroke="rgba(217,119,6,0.3)" stroke-width="1"/>
        <text x="400" y="37" text-anchor="middle" class="font-title" font-size="10" fill="#fde68a">200,000 TOKENS</text>

        <rect x="20" y="70" width="430" height="6" rx="3" fill="rgba(255,255,255,0.06)"/>
        <rect x="20" y="70" width="395" height="6" rx="3" fill="#d97706"/>
        <text x="20" y="98" class="font-mono" font-size="10.5" fill="#64748b">Remaining: 194.2K tokens free (97.1%)</text>
        <text x="450" y="98" text-anchor="end" class="font-mono" font-size="10.5" fill="#10b981">Optimal Load</text>
      </g>

      <!-- 3. ChatGPT GPT-4o -->
      <g transform="translate(0, 155)">
        <rect width="470" height="135" rx="12" fill="rgba(20,22,34,0.9)" stroke="rgba(16,163,127,0.4)" stroke-width="1.2"/>
        <circle cx="34" cy="34" r="14" fill="rgba(16,163,127,0.2)"/>
        <text x="34" y="39" text-anchor="middle" class="font-title" font-size="13" fill="#34d399">O</text>
        <text x="60" y="32" class="font-title" font-size="14" fill="#ffffff">ChatGPT (GPT-4o / Canvas)</text>
        <text x="60" y="48" class="font-body" font-size="11" fill="#94a3b8">OpenAI flagship multi-modal engine</text>

        <rect x="346" y="22" width="108" height="22" rx="4" fill="rgba(16,163,127,0.15)" stroke="rgba(16,163,127,0.3)" stroke-width="1"/>
        <text x="400" y="37" text-anchor="middle" class="font-title" font-size="10" fill="#a7f3d0">128,000 TOKENS</text>

        <rect x="20" y="70" width="430" height="6" rx="3" fill="rgba(255,255,255,0.06)"/>
        <rect x="20" y="70" width="380" height="6" rx="3" fill="#10a37f"/>
        <text x="20" y="98" class="font-mono" font-size="10.5" fill="#64748b">Remaining: 124.6K tokens free (97.3%)</text>
        <text x="450" y="98" text-anchor="end" class="font-mono" font-size="10.5" fill="#10b981">Optimal Load</text>
      </g>

      <!-- 4. DeepSeek R1 -->
      <g transform="translate(495, 155)">
        <rect width="470" height="135" rx="12" fill="rgba(20,22,34,0.9)" stroke="rgba(99,102,241,0.4)" stroke-width="1.2"/>
        <circle cx="34" cy="34" r="14" fill="rgba(99,102,241,0.2)"/>
        <text x="34" y="39" text-anchor="middle" class="font-title" font-size="13" fill="#818cf8">D</text>
        <text x="60" y="32" class="font-title" font-size="14" fill="#ffffff">DeepSeek R1 / V3</text>
        <text x="60" y="48" class="font-body" font-size="11" fill="#94a3b8">Deep first-principles reasoning models</text>

        <rect x="346" y="22" width="108" height="22" rx="4" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.3)" stroke-width="1"/>
        <text x="400" y="37" text-anchor="middle" class="font-title" font-size="10" fill="#c7d2fe">128,000 TOKENS</text>

        <rect x="20" y="70" width="430" height="6" rx="3" fill="rgba(255,255,255,0.06)"/>
        <rect x="20" y="70" width="375" height="6" rx="3" fill="#6366f1"/>
        <text x="20" y="98" class="font-mono" font-size="10.5" fill="#64748b">Remaining: 122.1K tokens free (95.4%)</text>
        <text x="450" y="98" text-anchor="end" class="font-mono" font-size="10.5" fill="#10b981">Optimal Load</text>
      </g>

      <!-- Bottom Feature Banner -->
      <g transform="translate(0, 310)">
        <rect width="965" height="75" rx="12" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="30" y="32" class="font-title" font-size="12" fill="#ffffff">AUTOMATIC MODEL DETECTION &amp; SIZING</text>
        <text x="30" y="52" class="font-body" font-size="11.5" fill="#94a3b8">Prompt+ detects host chatbot runtime automatically and configures optimal tokens-per-character heuristics.</text>
        <rect x="800" y="22" width="140" height="32" rx="6" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" stroke-width="1"/>
        <text x="870" y="42" text-anchor="middle" class="font-title" font-size="11" fill="#34d399">ZERO OVERFLOW</text>
      </g>
    </g>
  </g>
`;

// -------------------------------------------------------------
// SCREENSHOT 4: Chrome Extension Popup Hub
// -------------------------------------------------------------
const s4Content = `
  <g transform="translate(110, 166)" filter="url(#windowShadow)">
    <rect width="1060" height="580" rx="16" fill="#0d0e15" stroke="url(#windowBorder)" stroke-width="1"/>

    <!-- Mac Window Bar -->
    <rect width="1060" height="42" rx="16" fill="#14151f"/>
    <circle cx="24" cy="21" r="5.5" fill="#ef4444"/>
    <circle cx="42" cy="21" r="5.5" fill="#eab308"/>
    <circle cx="60" cy="21" r="5.5" fill="#22c55e"/>
    <text x="530" y="26" text-anchor="middle" class="font-title" font-size="12" fill="#94a3b8">Chrome Extension Command Hub (v2.1.3.2)</text>

    <!-- Chrome Browser Header Simulation -->
    <g transform="translate(40, 56)">
      <!-- Extension Action Popup Mockup -->
      <g transform="translate(340, 10)" filter="url(#windowShadow)">
        <rect width="380" height="440" rx="14" fill="#09090d" stroke="rgba(99,102,241,0.45)" stroke-width="1.2"/>

        <!-- Popup Header -->
        <g transform="translate(20, 20)">
          <circle cx="12" cy="12" r="12" fill="url(#primaryGrad)"/>
          <text x="12" y="16" text-anchor="middle" class="font-title" font-size="12" fill="#ffffff">P+</text>
          <text x="34" y="17" class="font-title" font-size="14.5" fill="#ffffff">Prompt+ Engine</text>
          <rect x="156" y="3" width="58" height="18" rx="4" fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.4)" stroke-width="1"/>
          <text x="185" y="15" text-anchor="middle" class="font-title" font-size="9" fill="#c7d2fe">v2.1.3.2</text>

          <!-- Status Indicator -->
          <circle cx="330" cy="12" r="4" fill="#10b981"/>
          <text x="320" y="16" text-anchor="end" class="font-body" font-size="10" font-weight="600" fill="#10b981">Online</text>
        </g>

        <!-- Mode Toggle Switch -->
        <g transform="translate(20, 60)">
          <rect width="340" height="34" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
          <rect x="4" y="4" width="162" height="26" rx="6" fill="#6366f1"/>
          <text x="85" y="21" text-anchor="middle" class="font-title" font-size="10.5" fill="#ffffff">⚡ Instant Local</text>
          <text x="250" y="21" text-anchor="middle" class="font-body" font-size="10.5" font-weight="600" fill="#71717a">☁️ Cloud AI 2.0</text>
        </g>

        <!-- Quick Blueprints Shelf -->
        <g transform="translate(20, 110)">
          <text x="0" y="0" class="font-title" font-size="10" fill="#71717a" letter-spacing="0.5">ENGINEERING BLUEPRINTS</text>

          <!-- Blueprint 1 -->
          <g transform="translate(0, 10)">
            <rect width="340" height="42" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <text x="14" y="25" class="font-title" font-size="11.5" fill="#ffffff">🏗️ System Architecture &amp; Scalability</text>
            <rect x="290" y="10" width="40" height="22" rx="4" fill="rgba(99,102,241,0.2)"/>
            <text x="310" y="25" text-anchor="middle" class="font-title" font-size="10" fill="#a5b4fc">Use</text>
          </g>

          <!-- Blueprint 2 -->
          <g transform="translate(0, 60)">
            <rect width="340" height="42" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <text x="14" y="25" class="font-title" font-size="11.5" fill="#ffffff">🛡️ Security &amp; OWASP Deep Audit</text>
            <rect x="290" y="10" width="40" height="22" rx="4" fill="rgba(99,102,241,0.2)"/>
            <text x="310" y="25" text-anchor="middle" class="font-title" font-size="10" fill="#a5b4fc">Use</text>
          </g>

          <!-- Blueprint 3 -->
          <g transform="translate(0, 110)">
            <rect width="340" height="42" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <text x="14" y="25" class="font-title" font-size="11.5" fill="#ffffff">⚡ High-Performance DB &amp; Indexing</text>
            <rect x="290" y="10" width="40" height="22" rx="4" fill="rgba(99,102,241,0.2)"/>
            <text x="310" y="25" text-anchor="middle" class="font-title" font-size="10" fill="#a5b4fc">Use</text>
          </g>
        </g>

        <!-- Quota & Cloud Balance -->
        <g transform="translate(20, 290)">
          <rect width="340" height="60" rx="9" fill="rgba(16,185,129,0.06)" stroke="rgba(16,185,129,0.2)" stroke-width="1"/>
          <text x="14" y="24" class="font-title" font-size="11" fill="#34d399">Cloud Reasoning Balance</text>
          <text x="326" y="24" text-anchor="end" class="font-title" font-size="12" fill="#ffffff">45 / 50 Credits</text>
          <rect x="14" y="36" width="312" height="5" rx="2.5" fill="rgba(255,255,255,0.08)"/>
          <rect x="14" y="36" width="280" height="5" rx="2.5" fill="#10b981"/>
        </g>

        <!-- Footer -->
        <g transform="translate(20, 375)">
          <text x="0" y="16" class="font-body" font-size="10" fill="#64748b">⌘ + Shift + P: Global In-Page Launcher</text>
          <text x="340" y="16" text-anchor="end" class="font-title" font-size="10" fill="#818cf8">Settings &amp; Web Bridge →</text>
        </g>
      </g>
    </g>

    <!-- Side Annotations -->
    <g transform="translate(60, 160)">
      <rect width="220" height="120" rx="12" fill="rgba(20,20,30,0.8)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="18" y="26" class="font-title" font-size="11.5" fill="#a5b4fc">TWO ENGINES IN ONE</text>
      <text x="18" y="52" class="font-body" font-size="11" fill="#cbd5e1">• Local Synthesis: Zero latency, unlimited usage, fully private</text>
      <text x="18" y="88" class="font-body" font-size="11" fill="#cbd5e1">• Cloud AI: Deep multimodal reasoning &amp; auto-repair</text>
    </g>

    <g transform="translate(780, 160)">
      <rect width="220" height="120" rx="12" fill="rgba(20,20,30,0.8)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="18" y="26" class="font-title" font-size="11.5" fill="#34d399">WEB APP SYNC</text>
      <text x="18" y="52" class="font-body" font-size="11" fill="#cbd5e1">• Instant session broadcast from prompt-plus.vercel.app</text>
      <text x="18" y="88" class="font-body" font-size="11" fill="#cbd5e1">• Real-time quota balance and saved blocks sync</text>
    </g>
  </g>
`;

// -------------------------------------------------------------
// SCREENSHOT 5: Universal Multi-Chatbot Compatibility
// -------------------------------------------------------------
const s5Content = `
  <g transform="translate(110, 166)" filter="url(#windowShadow)">
    <rect width="1060" height="580" rx="16" fill="#0d0e15" stroke="url(#windowBorder)" stroke-width="1"/>

    <!-- Mac Window Bar -->
    <rect width="1060" height="42" rx="16" fill="#14151f"/>
    <circle cx="24" cy="21" r="5.5" fill="#ef4444"/>
    <circle cx="42" cy="21" r="5.5" fill="#eab308"/>
    <circle cx="60" cy="21" r="5.5" fill="#22c55e"/>
    <text x="530" y="26" text-anchor="middle" class="font-title" font-size="12" fill="#94a3b8">Universal In-Page AI Coverage Matrix</text>

    <!-- 12 Chatbot Grid Cards -->
    <g transform="translate(60, 70)">
      ${[
        { name: "ChatGPT (GPT-4o)", color: "#10a37f", tag: "OpenAI", desc: "Native floating trigger on prompt capsule" },
        { name: "Claude 3.5 Sonnet", color: "#d97706", tag: "Anthropic", desc: "ProseMirror rich editor integration" },
        { name: "Google Gemini 2.0", color: "#3b82f6", tag: "Google", desc: "1M window context monitoring" },
        { name: "Google AI Studio", color: "#4285f4", tag: "Google Cloud", desc: "Developer IDE input tracking" },
        { name: "DeepSeek R1 / V3", color: "#6366f1", tag: "DeepSeek", desc: "First-principles deduction logic" },
        { name: "Grok 3", color: "#ec4899", tag: "xAI", desc: "Full X/Grok platform compatibility" },
        { name: "Perplexity AI", color: "#20b2aa", tag: "Perplexity", desc: "Search &amp; synthesis optimization" },
        { name: "Microsoft Copilot", color: "#0078d4", tag: "Microsoft", desc: "Enterprise &amp; web chat support" },
        { name: "Mistral Le Chat", color: "#ea580c", tag: "Mistral AI", desc: "Open-weight frontier model support" },
        { name: "Meta Llama 3", color: "#0668e1", tag: "Meta AI", desc: "Direct in-page prompt enhancer" },
        { name: "Poe by Quora", color: "#8b5cf6", tag: "Quora", desc: "Multi-bot aggregation client support" },
        { name: "HuggingChat", color: "#f59e0b", tag: "HuggingFace", desc: "Open source ecosystem integration" }
      ].map((item, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = col * 320;
        const y = row * 110;
        return `
          <g transform="translate(${x}, ${y})">
            <rect width="300" height="92" rx="10" fill="rgba(20,22,34,0.85)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <circle cx="26" cy="28" r="10" fill="${item.color}" fill-opacity="0.2"/>
            <circle cx="26" cy="28" r="4" fill="${item.color}"/>
            <text x="46" y="26" class="font-title" font-size="12" fill="#ffffff">${item.name}</text>
            <rect x="230" y="16" width="56" height="18" rx="4" fill="rgba(255,255,255,0.06)"/>
            <text x="258" y="28" text-anchor="middle" class="font-body" font-size="8.5" font-weight="bold" fill="#a1a1aa">${item.tag}</text>
            <text x="20" y="58" class="font-body" font-size="10" fill="#94a3b8">${item.desc}</text>
            <text x="20" y="76" class="font-mono" font-size="9" fill="#10b981">✓ Verified Native Hook</text>
          </g>
        `;
      }).join("\n")}
    </g>

    <!-- Bottom Highlights -->
    <g transform="translate(60, 520)">
      <rect width="940" height="36" rx="8" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.3)" stroke-width="1"/>
      <text x="470" y="22" text-anchor="middle" class="font-title" font-size="11.5" fill="#c7d2fe">
        Zero Configuration Required · Installs in 5 Seconds · Automatically Detects Host AI Framework
      </text>
    </g>
  </g>
`;

// Screenshot definitions
const SCREENSHOTS = [
  {
    id: "01-one-click-optimizer",
    badge: "1-CLICK PROMPT OPTIMIZER",
    headline: "Turn Raw Thoughts into Production-Grade Prompts in 1 Click",
    subheadline: "Floating native accelerator embedded directly inside ChatGPT, Claude, Gemini, and DeepSeek.",
    contentSvg: s1Content
  },
  {
    id: "02-studio-popover",
    badge: "PROMPT+ STUDIO POPOVER",
    headline: "Five Tailored Engineering Personas at Your Fingertips",
    subheadline: "Switch effortlessly between Natural Human, Tech Architect, Conversion Copy, and Deep Reasoner.",
    contentSvg: s2Content
  },
  {
    id: "03-context-telemetry",
    badge: "LIVE CONTEXT TELEMETRY",
    headline: "Real-Time Context Window Telemetry & Memory Safeguards",
    subheadline: "Live token metrics and capacity safeguards tuned to 12+ leading AI model architectures.",
    contentSvg: s3Content
  },
  {
    id: "04-extension-command-center",
    badge: "EXTENSION COMMAND CENTER",
    headline: "Instant Extension Command Hub & Curated Blueprints",
    subheadline: "Browse battle-tested prompt blueprints, toggle cloud reasoning models, and inspect quotas.",
    contentSvg: s4Content
  },
  {
    id: "05-universal-compatibility",
    badge: "UNIVERSAL COMPATIBILITY",
    headline: "Universal Coverage Across 12+ Leading AI Platforms",
    subheadline: "Works natively with zero configuration across every major frontier AI model interface.",
    contentSvg: s5Content
  }
];

console.log("🎨 Generating 5 Chrome Web Store Screenshots (1280x800)...");

for (let i = 0; i < SCREENSHOTS.length; i++) {
  const item = SCREENSHOTS[i];
  const svgContent = baseLayout(item);
  const svgPath = path.join(OUT_DIR, `${item.id}.svg`);
  const pngPath = path.join(OUT_DIR, `${item.id}.png`);
  const jpgPath = path.join(OUT_DIR, `${item.id}.jpg`);

  fs.writeFileSync(svgPath, svgContent);

  // Convert SVG to 1280x800 PNG via macOS sips
  execSync(`sips -s format png "${svgPath}" --out "${pngPath}"`, { stdio: "pipe" });
  execSync(`sips -z 800 1280 "${pngPath}" --out "${pngPath}"`, { stdio: "pipe" });

  // Convert SVG to 1280x800 JPEG via macOS sips (strictly no alpha channel)
  execSync(`sips -s format jpeg "${svgPath}" --out "${jpgPath}"`, { stdio: "pipe" });
  execSync(`sips -z 800 1280 "${jpgPath}" --out "${jpgPath}"`, { stdio: "pipe" });

  // Copy to public directory for easy web preview
  fs.copyFileSync(pngPath, path.join(PUBLIC_DIR, `${item.id}.png`));
  fs.copyFileSync(jpgPath, path.join(PUBLIC_DIR, `${item.id}.jpg`));

  console.log(`✅ [${i + 1}/5] Generated ${item.id}.jpg & .png (1280x800)`);
}

console.log("\n🚀 All 5 Chrome Web Store promotional screenshots created successfully!");
console.log(`📍 Output Location: ${OUT_DIR}`);
console.log(`📍 Web Preview Location: ${PUBLIC_DIR}`);
