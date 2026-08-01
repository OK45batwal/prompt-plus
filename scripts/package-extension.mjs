import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const extDir = path.join(rootDir, "extension");
const distDir = path.join(rootDir, "dist");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const manifest = JSON.parse(fs.readFileSync(path.join(extDir, "manifest.json"), "utf-8"));
const zipName = `prompt-plus-extension-v${manifest.version}.zip`;
const zipPath = path.join(distDir, zipName);

console.log(`📦 Packaging Prompt+ Extension v${manifest.version}...`);

try {
  // Zip extension files using zip command
  execSync(`cd "${extDir}" && zip -r "${zipPath}" manifest.json background.js content.js popup.html popup.js icons/ README.md`, {
    stdio: "inherit",
  });
  console.log(`\n✅ Extension packaged successfully!`);
  console.log(`📍 Output Archive: ${zipPath}`);
  console.log(`🚀 Ready to upload to Chrome Web Store, Edge Add-ons, and Firefox AMO.\n`);
} catch (err) {
  console.error("❌ Failed to create zip archive:", err.message);
  process.exit(1);
}
