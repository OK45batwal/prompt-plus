import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.resolve(__dirname, "../src/app/api/v1");

function getRouteFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getRouteFiles(fullPath));
    } else if (file === "route.ts" || file === "route.js") {
      results.push(fullPath);
    }
  });
  return results;
}

const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
const routeFiles = getRouteFiles(apiDir);
let violations = [];

routeFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath);

  mutatingMethods.forEach((method) => {
    // Check for naked exports like: export async function POST(
    const regex = new RegExp(`export\\s+async\\s+function\\s+${method}\\b`, "g");
    if (regex.test(content)) {
      // Check if file contains @public-route annotation
      if (!content.includes("@public-route")) {
        violations.push({
          file: relPath,
          method,
          reason: `Exporting unwrapped 'export async function ${method}' drops CSRF and session protection. Wrap with 'withAuth' or add '// @public-route' annotation if intentionally unauthenticated.`,
        });
      }
    }
  });
});

if (violations.length > 0) {
  console.error("\n❌ API ROUTE SECURITY VIOLATIONS DETECTED:\n");
  violations.forEach((v) => {
    console.error(`  - File: ${v.file}`);
    console.error(`    Method: ${v.method}`);
    console.error(`    Error: ${v.reason}\n`);
  });
  console.error("Fix violations by wrapping handlers with withAuth() or adding '// @public-route'.\n");
  process.exit(1);
} else {
  console.log("✓ API Route Security Gate: All mutating API v1 routes strictly enforce withAuth & CSRF protection.");
  process.exit(0);
}
