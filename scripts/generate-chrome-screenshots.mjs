/**
 * Chrome Web Store promo art, built from real captures of the shipped extension.
 *
 * The popup and the in-page dock are photographed with Playwright at 2x and
 * composited onto the branded 1280x800 canvas by sharp. No screen is drawn by
 * hand, so the listing cannot advertise UI the extension does not have, and the
 * version pill in the art is the one in the manifest it was captured from.
 *
 * macOS only: the background chrome is rasterised with `sips`.
 */
import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const OUT_DIR = path.resolve("promo-screenshots");
const PUBLIC_DIR = path.resolve("public/screenshots");
const RAW_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "pp-promo-raw-"));
const EXTENSION_PATH = path.resolve("extension");

const WIDTH = 1280;
const HEIGHT = 800;
// The stage every shot composes into, in canvas coordinates.
const STAGE = { x: 110, y: 166, w: 1060, h: 580 };
const TITLE_BAR = 42;
// The popup is 410x560; this is that aspect at the stage height.
const POPUP = { w: 425, h: 580 };

const DRAFT = "add rate limiting to the auth middleware";

// A neutral host page. The dock itself is the shipped extension; this page is
// only a backdrop, so it carries no third-party branding to pass off.
const DEMO_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Assistant</title><style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0f1014; color: #e5e7eb; }
  .top { padding: 16px 28px; border-bottom: 1px solid #1f2230; font-weight: 600; color: #9ca3af; font-size: 13px; letter-spacing: .4px; }
  main { max-width: 760px; margin: 0 auto; padding: 30px 28px 220px; }
  .msg { margin-bottom: 24px; }
  .who { font-size: 11.5px; text-transform: uppercase; letter-spacing: .9px; color: #6b7280; margin-bottom: 7px; }
  .bubble { background: #171922; border: 1px solid #232637; border-radius: 12px; padding: 13px 16px; }
  .me .bubble { background: #10222a; border-color: #164e5f; }
  code { font-family: "SF Mono", Menlo, monospace; font-size: 13px; color: #67e8f9; }
  .composer { position: fixed; bottom: 0; left: 0; right: 0; padding: 20px 28px 28px; background: linear-gradient(transparent, #0f1014 34%); }
  .box { max-width: 760px; margin: 0 auto; background: #171922; border: 1px solid #2a2e42; border-radius: 14px; padding: 13px 15px; }
  textarea { width: 100%; height: 48px; background: transparent; border: 0; color: #e5e7eb; font: inherit; resize: none; outline: none; }
</style></head><body>
  <div class="top">Assistant</div>
  <main>
    <div class="msg me"><div class="who">You</div><div class="bubble">The login endpoint lets people hammer it. What is the least invasive fix?</div></div>
    <div class="msg"><div class="who">Assistant</div><div class="bubble">Rate limiting at the edge is usually enough. You need a counter store, a window, and a response code that tells the client to back off.</div></div>
    <div class="msg me"><div class="who">You</div><div class="bubble">We already run Redis for sessions.</div></div>
    <div class="msg"><div class="who">Assistant</div><div class="bubble">Then reuse it: <code>INCR</code> with an expiry per key is the smallest change that holds under load.</div></div>
  </main>
  <form class="composer" onsubmit="event.preventDefault()"><div class="box"><textarea id="prompt-textarea" placeholder="Reply to the assistant"></textarea></div></form>
</body></html>`;

const rectOf = (box) => ({ x: box.x * 2, y: box.y * 2, w: box.width * 2, h: box.height * 2 });

// The chat column sits well inside the viewport, so the crop keeps the page's
// own left margin: a page shot must never slice a line mid-word. It is
// bottom-anchored because the dock and the review modal both live down there.
function pageCrop(raw) {
  const width = raw.viewport.w - 200;
  const height = Math.round(width / (WINDOW_SLOT.w / WINDOW_SLOT.h));
  return { left: 200, top: raw.viewport.h - height, width, height };
}

// -------------------------------------------------------------
// 1. Capture the real extension
// -------------------------------------------------------------
async function capture() {
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
  });
  // No API stub: the popup talks to the real site, so the capture shows the
  // connection state a real user sees instead of a harness-induced "Offline".
  await context.route("https://chatgpt.com/**", (r) => r.fulfill({ contentType: "text/html", body: DEMO_PAGE }));

  const worker = context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker"));
  const extensionId = new URL(worker.url()).host;
  const raws = {};

  const grab = async (locator, name) => {
    const box = await locator.boundingBox();
    raws[name] = { buffer: await locator.screenshot(), box: rectOf(box) };
  };

  // ----- popup -----
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  // The header's connection state is part of what the art shows, so wait for the
  // real health probe rather than a fixed sleep that catches "Not checked".
  await popup.waitForFunction(
    () => {
      const el = document.getElementById("sync-status-text");
      return !!el && el.textContent !== "Not checked";
    },
    null,
    { timeout: 20000 },
  );
  await popup.waitForTimeout(300);

  await popup.locator("#input").fill(DRAFT);
  await popup.waitForTimeout(250);
  await grab(popup.locator("body"), "popupEnhance");

  // The launcher and the engine switch both live inside the Advanced drawer.
  await popup.locator("#advanced-tools-toggle").click();
  await popup.waitForTimeout(250);
  await popup.locator("#bridge-chatgpt").scrollIntoViewIfNeeded();
  await popup.waitForTimeout(350);
  await grab(popup.locator("body"), "popupLauncher");

  await popup.locator("#mode-algo").click();
  await popup.locator("#enhance-btn").click();
  await popup.locator("#result-body").waitFor({ state: "attached" });
  await popup.waitForTimeout(600);
  await grab(popup.locator("body"), "popupResultDiff");

  // Show the result as edited by the user, which is what the reset control is for.
  await popup.locator("#review-tab-result").click();
  await popup.waitForTimeout(250);
  await popup.locator("#result-body").click();
  await popup.keyboard.press("End");
  await popup.keyboard.type("\n\nTrace id: req-8f21");
  await popup.waitForTimeout(350);
  await grab(popup.locator("body"), "popupResultFinal");

  // ----- in-page dock and review modal -----
  const page = await context.newPage();
  await page.goto("https://chatgpt.com/c/promo");
  await page.locator(".pp-unified-dock").waitFor({ state: "visible" });
  await page.locator("#prompt-textarea").fill(DRAFT);
  await page.waitForTimeout(700);
  raws.pageDock = { buffer: await page.screenshot() };

  const tabId = await worker.evaluate(`chrome.tabs.query({}).then((tabs) => tabs.find((t) => t.url.includes("/c/promo")).id)`);
  await worker.evaluate(
    `chrome.tabs.sendMessage(${tabId}, {action:'injectEnhanced', enhanced:'You are a senior backend engineer.\\n\\n### Task\\nAdd rate limiting to the auth middleware.\\n\\n### Constraints\\n- Redis-backed, no new dependencies\\n- Return 429 with a Retry-After header'})`,
  );
  await page.getByRole("dialog", { name: "Review enhancement" }).waitFor({ state: "visible" });
  await page.waitForTimeout(700);
  raws.pageModal = { buffer: await page.screenshot() };

  await context.close();
  for (const [name, raw] of Object.entries(raws)) {
    fs.writeFileSync(path.join(RAW_DIR, `${name}.png`), raw.buffer);
  }
  return raws;
}

// -------------------------------------------------------------
// 2. Crop helpers
// -------------------------------------------------------------

// -------------------------------------------------------------
// 3. Canvas chrome
// -------------------------------------------------------------
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
    <radialGradient id="bgGlow" cx="50%" cy="0%" r="85%">
      <stop offset="0%" stop-color="#083344" stop-opacity="0.65"/>
      <stop offset="50%" stop-color="#09090b" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="accentAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <linearGradient id="windowBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.2)"/>
      <stop offset="50%" stop-color="rgba(6,182,212,0.3)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.08)"/>
    </linearGradient>
    <pattern id="gridDots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#ffffff" fill-opacity="0.05"/>
    </pattern>
    <filter id="windowShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.8"/>
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#06b6d4" flood-opacity="0.2"/>
    </filter>
  </defs>

  <style>
    .font-title { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif; font-weight: 800; }
    .font-body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", sans-serif; }
  </style>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="#09090b"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGlow)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#gridDots)"/>
  <circle cx="640" cy="500" r="450" fill="url(#accentAura)"/>

  <g transform="translate(640, 56)" text-anchor="middle">
    <rect x="-110" y="0" width="220" height="26" rx="13" fill="rgba(6, 182, 212, 0.12)" stroke="rgba(6, 182, 212, 0.4)" stroke-width="1"/>
    <text x="0" y="17" class="font-title" font-size="10.5" fill="#67e8f9" letter-spacing="1.5">${escapeXml(badge)}</text>
    <text x="0" y="60" class="font-title" font-size="33" fill="url(#textGrad)" letter-spacing="-0.5">${escapeXml(headline)}</text>
    <text x="0" y="88" class="font-body" font-size="14.5" fill="#94a3b8" letter-spacing="-0.2">${escapeXml(subheadline)}</text>
  </g>

  <g id="main-content">
    ${contentSvg}
  </g>
</svg>`;
}

// A browser window whose body is filled by the capture.
function browserWindow(title) {
  const { x, y, w, h } = STAGE;
  return `
  <g transform="translate(${x}, ${y})" filter="url(#windowShadow)">
    <rect width="${w}" height="${h}" rx="16" fill="#0d0e15" stroke="url(#windowBorder)" stroke-width="1"/>
    <rect width="${w}" height="${TITLE_BAR}" rx="16" fill="#14151f"/>
    <rect y="${TITLE_BAR - 14}" width="${w}" height="14" fill="#14151f"/>
    <circle cx="24" cy="21" r="5.5" fill="#ef4444"/>
    <circle cx="42" cy="21" r="5.5" fill="#eab308"/>
    <circle cx="60" cy="21" r="5.5" fill="#22c55e"/>
    <text x="${w / 2}" y="26" text-anchor="middle" class="font-title" font-size="12" fill="#94a3b8">${escapeXml(title)}</text>
    <rect x="0" y="${TITLE_BAR}" width="${w}" height="${h - TITLE_BAR}" fill="#0f1014"/>
  </g>`;
}

function popupFrames(slots) {
  return slots
    .map(
      (s) => `
  <g filter="url(#windowShadow)">
    <rect x="${s.x - 1}" y="${s.y - 1}" width="${s.w + 2}" height="${s.h + 2}" rx="16" fill="#0d0e15" stroke="url(#windowBorder)" stroke-width="1.5"/>
  </g>`,
    )
    .join("");
}

// -------------------------------------------------------------
// 4. The five shots
// -------------------------------------------------------------
const WINDOW_SLOT = { x: STAGE.x, y: STAGE.y + TITLE_BAR, w: STAGE.w, h: STAGE.h - TITLE_BAR };
const singlePopup = { x: Math.round((WIDTH - POPUP.w) / 2), y: STAGE.y, w: POPUP.w, h: POPUP.h };
const leftPopup = { x: 200, y: STAGE.y, w: POPUP.w, h: POPUP.h };
const rightPopup = { x: 655, y: STAGE.y, w: POPUP.w, h: POPUP.h };

const SHOTS = [
  {
    id: "01-in-page-dock",
    badge: "IN-PAGE PROMPT EDITOR",
    headline: "Compile a better prompt without leaving the chat",
    subheadline: "Prompt+ sits in the composer beside your draft, so you keep your place and your context.",
    contentSvg: browserWindow("Any supported AI chat"),
    layers: [
      {
        raw: "pageDock",
        slot: { ...WINDOW_SLOT, mask: "window" },
        crop: pageCrop,
      },
    ],
  },
  {
    id: "02-review-before-you-accept",
    badge: "REVIEW BEFORE YOU ACCEPT",
    headline: "See the rewrite as a diff, then accept or discard",
    subheadline: "Insertions are marked inline. Nothing reaches your composer until you say so.",
    contentSvg: browserWindow("The draft, before anything is inserted"),
    layers: [
      {
        raw: "pageModal",
        slot: { ...WINDOW_SLOT, mask: "window" },
        crop: pageCrop,
      },
    ],
  },
  {
    id: "03-prompt-inspector",
    badge: "PROMPT INSPECTOR",
    headline: "Your draft is checked before it is compiled",
    subheadline: "Prompt+ names the gaps it can see in the draft, then compiles around them.",
    contentSvg: popupFrames([singlePopup]),
    layers: [{ raw: "popupEnhance", slot: { ...singlePopup, mask: "popup" }, crop: null }],
  },
  {
    id: "04-review-the-result",
    badge: "REVIEW THE RESULT",
    headline: "Read every change, then edit the result yourself",
    subheadline: "Switch between what changed and the final prompt. Whatever you edit is what gets copied.",
    contentSvg: popupFrames([leftPopup, rightPopup]),
    layers: [
      { raw: "popupResultDiff", slot: { ...leftPopup, mask: "popup" }, crop: null },
      { raw: "popupResultFinal", slot: { ...rightPopup, mask: "popup" }, crop: null },
    ],
  },
  {
    id: "05-every-ai-platform",
    badge: "EVERY CHAT YOU ALREADY USE",
    headline: "Send the finished prompt to any of eight AI platforms",
    subheadline: "ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot and Meta AI.",
    contentSvg: popupFrames([singlePopup]),
    layers: [{ raw: "popupLauncher", slot: { ...singlePopup, mask: "popup" }, crop: null }],
  },
];

// -------------------------------------------------------------
// 5. Compose
// -------------------------------------------------------------
function maskSvg(kind, w, h) {
  const body =
    kind === "window"
      ? `<path d="M0 0 H${w} V${h - 16} A16 16 0 0 1 ${w - 16} ${h} H16 A16 16 0 0 1 0 ${h - 16} Z" fill="#ffffff"/>`
      : `<rect width="${w}" height="${h}" rx="14" fill="#ffffff"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
}

async function roundedCapture(raw, layer) {
  const { slot } = layer;
  const box = layer.crop ? layer.crop(raw) : { left: 0, top: 0, width: raw.viewport.w, height: raw.viewport.h };
  return sharp(raw.buffer)
    .extract(box)
    .resize(slot.w, slot.h, { fit: "cover" })
    .composite([{ input: maskSvg(slot.mask, slot.w, slot.h), blend: "dest-in" }])
    .png()
    .toBuffer();
}

const raw = await capture();
// Attach the viewport to every capture so crops can be clamped to it.
for (const name of ["popupEnhance", "popupLauncher", "popupResultDiff", "popupResultFinal"]) {
  raw[name].viewport = { x: 0, y: 0, w: raw[name].box.w, h: raw[name].box.h };
}
for (const name of ["pageDock", "pageModal"]) {
  raw[name].viewport = { x: 0, y: 0, w: 2560, h: 1600 };
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

console.log(`🎨 Captured the shipped extension into ${RAW_DIR}`);

for (const shot of SHOTS) {
  const svgPath = path.join(RAW_DIR, `${shot.id}.svg`);
  const bgPath = path.join(RAW_DIR, `${shot.id}.png`);
  const pngPath = path.join(OUT_DIR, `${shot.id}.png`);
  const jpgPath = path.join(OUT_DIR, `${shot.id}.jpg`);

  fs.writeFileSync(svgPath, baseLayout(shot));
  execSync(`sips -s format png "${svgPath}" --out "${bgPath}"`, { stdio: "pipe" });
  execSync(`sips -z ${HEIGHT} ${WIDTH} "${bgPath}" --out "${bgPath}"`, { stdio: "pipe" });

  const layers = [];
  for (const layer of shot.layers) {
    layers.push({ input: await roundedCapture(raw[layer.raw], layer), left: layer.slot.x, top: layer.slot.y });
  }

  const composed = await sharp(bgPath).composite(layers).png().toBuffer();
  await sharp(composed).png().toFile(pngPath);
  await sharp(composed).flatten({ background: "#09090b" }).jpeg({ quality: 92 }).toFile(jpgPath);
  fs.copyFileSync(pngPath, path.join(PUBLIC_DIR, `${shot.id}.png`));
  fs.copyFileSync(jpgPath, path.join(PUBLIC_DIR, `${shot.id}.jpg`));

  console.log(`✅ [${SHOTS.indexOf(shot) + 1}/${SHOTS.length}] ${shot.id}.png + .jpg (${WIDTH}x${HEIGHT})`);
}

console.log(`\n📍 ${OUT_DIR}\n📍 ${PUBLIC_DIR}`);
