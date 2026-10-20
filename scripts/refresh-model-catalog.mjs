#!/usr/bin/env node
/**
 * Re-checks the catalog against official provider metadata.
 *
 *   node scripts/refresh-model-catalog.mjs          # report drift, exit 1 if found
 *   node scripts/refresh-model-catalog.mjs --write  # apply OpenRouter prices/context
 *
 * A failed fetch exits 2 and never modifies the catalog, so the app keeps the last
 * reviewed snapshot. Google prices stay manual: its pricing page has no stable
 * machine-readable payload, so only model presence is checked there.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "src/lib/models.json");
const write = process.argv.includes("--write");
const today = new Date().toISOString().slice(0, 10);

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const problems = [];
const updates = [];

const openRouter = catalog.filter((m) => m.provider === "openrouter");
const google = catalog.filter((m) => m.provider === "google");

if (openRouter.length) {
  let response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/models");
  } catch (error) {
    console.error(`Could not reach OpenRouter: ${error.message}. Catalog left unchanged.`);
    process.exit(2);
  }
  if (!response.ok) {
    console.error(`OpenRouter returned HTTP ${response.status}. Catalog left unchanged.`);
    process.exit(2);
  }
  const live = new Map(((await response.json()).data || []).map((m) => [m.id, m]));
  for (const model of openRouter) {
    const remote = live.get(model.rawModel);
    if (!remote) {
      problems.push(`${model.id}: ${model.rawModel} is not listed by OpenRouter`);
      continue;
    }
    const input = Number(remote.pricing?.prompt) * 1_000_000;
    const output = Number(remote.pricing?.completion) * 1_000_000;
    if (Math.abs(input - (model.pricing.inputPer1M ?? 0)) > 0.0001 || Math.abs(output - (model.pricing.outputPer1M ?? 0)) > 0.0001) {
      problems.push(`${model.id}: price moved $${model.pricing.inputPer1M}/$${model.pricing.outputPer1M} → $${round(input)}/$${round(output)} per 1M`);
      updates.push({ model, pricing: { ...model.pricing, inputPer1M: round(input), outputPer1M: round(output), verifiedAt: today } });
    } else {
      updates.push({ model, pricing: { ...model.pricing, verifiedAt: today } });
    }
    if (remote.context_length && remote.context_length !== model.contextWindow) {
      problems.push(`${model.id}: context ${model.contextWindow} → ${remote.context_length}`);
    }
  }
}

if (google.length) {
  let html = "";
  try {
    const res = await fetch("https://ai.google.dev/gemini-api/docs/pricing");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (error) {
    console.error(`Could not reach the Gemini pricing page: ${error.message}. Catalog left unchanged.`);
    process.exit(2);
  }
  for (const model of google) {
    if (!html.includes(model.rawModel)) {
      problems.push(`${model.id}: ${model.rawModel} is not on the Gemini pricing page`);
    }
  }
}

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
}

if (problems.length) {
  console.log(`Catalog drift (${problems.length}):`);
  for (const problem of problems) console.log(`  - ${problem}`);
} else {
  console.log("Catalog matches the published provider metadata.");
}

if (write && updates.length) {
  for (const { model, pricing } of updates) model.pricing = pricing;
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Updated verifiedAt for ${updates.length} OpenRouter entr${updates.length === 1 ? "y" : "ies"}.`);
} else if (problems.length) {
  console.log("Run with --write to accept OpenRouter price/context changes, then review the diff.");
}

for (const model of catalog.filter((m) => m.provider === "google" || m.provider === "openai" || m.provider === "anthropic")) {
  if (model.pricing.inputPer1M !== null && model.access !== "unknown") {
    console.log(`Manual review: ${model.id} (${model.pricing.sourceUrl})`);
  }
}
process.exit(problems.length && !write ? 1 : 0);
