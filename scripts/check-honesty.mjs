#!/usr/bin/env node
/**
 * Honesty gate.
 *
 * Fails CI when a fabricated claim or invented number is reintroduced into
 * user-facing code. Every rule maps to a lie this repo actually shipped at some
 * point; see docs/UI-UX-IMPROVEMENT-PLAN.md (Phase 0-1).
 *
 * This catches regressions of known patterns. It cannot judge a new claim, so
 * reviewers still own "is this true?".
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const RULES = [
  {
    id: "fabricated-review-markup",
    // Invented star ratings in structured data mislead users and search engines.
    pattern: /\baggregateRating\b/,
    include: [/^src\/.*\.tsx?$/],
    fix: "Remove the invented rating, or build it from really stored reviews.",
  },
  {
    id: "hardcoded-ui-version",
    // "v2.1.3" badges drift from the shipped version within one release.
    pattern: /\bv\d+\.\d+\.\d+/,
    include: [/^src\/app\/.*\.tsx$/, /^src\/components\/.*\.tsx$/],
    fix: "Import the real version (src/lib/version.ts or package.json) instead.",
  },
  {
    id: "hardcoded-version-field",
    pattern: /version:\s*["'`]\d+\.\d+\.\d+/,
    include: [/^src\/.*\.tsx?$/],
    exclude: [/^src\/app\/api\/v1\/docs\/route\.ts$/], // OpenAPI spec version
    fix: "Return a real version, or delete the field if nothing consumes it.",
  },
  {
    id: "fabricated-validation-copy",
    pattern: /Successfully (validated|verified|connected)/,
    include: [/^src\/.*\.tsx?$/],
    fix: "Only report success after a real check actually passed.",
  },
  {
    id: "invented-population-claim",
    pattern: /(join|joined by|loved by|trusted by)\s+(thousands|millions|\d[\d,]{2,})/i,
    include: [/^src\/.*\.tsx?$/],
    fix: "Delete the claim, or source real numbers from analytics.",
  },
  {
    id: "unmeasured-performance-claim",
    pattern: /\b(\d+x (better|faster|cheaper|more)|sub-\d+\s?ms|~?\d{1,2}% (faster|better|cheaper|less))/i,
    include: [/^src\/.*\.tsx?$/],
    fix: "Delete the claim, or measure it and label it as a benchmark.",
  },
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(path.join(root, "src"));
const violations = [];

for (const file of files) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  for (const rule of RULES) {
    if (rule.include && !rule.include.some((re) => re.test(rel))) continue;
    if (rule.exclude && rule.exclude.some((re) => re.test(rel))) continue;

    const lines = fs.readFileSync(file, "utf-8").split("\n");
    lines.forEach((line, i) => {
      const match = line.match(rule.pattern);
      if (match) {
        violations.push({
          rule: rule.id,
          location: `${rel}:${i + 1}`,
          found: match[0],
          fix: rule.fix,
        });
      }
    });
  }
}

if (violations.length > 0) {
  console.error("\n❌ HONESTY GATE FAILED — fabricated or unverifiable claim detected:\n");
  for (const v of violations) {
    console.error(`  ${v.location}  [${v.rule}]`);
    console.error(`    found: "${v.found}"`);
    console.error(`    fix:   ${v.fix}\n`);
  }
  process.exit(1);
}

console.log(
  `✓ Honesty Gate: no fabricated claims found across ${files.length} source files (${RULES.length} rules).`
);
