import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDirs = ["v1", "v2"].map((version) => path.resolve(__dirname, `../src/app/api/${version}`));

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

const allMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const routeFiles = apiDirs.flatMap(getRouteFiles);
let violations = [];

routeFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath);

  allMethods.forEach((method) => {
    // Check for unwrapped exports like: export async function GET(
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
  console.log("✓ API Route Security Gate: API v1/v2 routes use withAuth or explicitly declare public access.");
  process.exit(0);
}
