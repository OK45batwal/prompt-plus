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

// Clean up old versioned zip files in dist and public
const cleanOldZips = (dir) => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (/^prompt-plus-extension-v.*\.zip$/.test(file) && file !== zipName) {
        fs.unlinkSync(path.join(dir, file));
        console.log(`🧹 Removed old zip: ${file}`);
      }
    }
  }
};

cleanOldZips(distDir);
cleanOldZips(path.join(rootDir, "public"));

console.log(`📦 Packaging Prompt+ Extension v${manifest.version}...`);

try {
  // Zip extension files using zip command
  execSync(`cd "${extDir}" && zip -r "${zipPath}" manifest.json background.js content.js popup.html popup.js icons/ adapters/ README.md`, {
    stdio: "inherit",
  });

  const publicDir = path.join(rootDir, "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy to public for direct web download endpoints
  const publicZipPath = path.join(publicDir, "prompt-plus-extension.zip");
  const publicVerZipPath = path.join(publicDir, zipName);
  fs.copyFileSync(zipPath, publicZipPath);
  fs.copyFileSync(zipPath, publicVerZipPath);

  const stats = fs.statSync(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`\n✅ Extension packaged successfully! (${sizeKB} KB)`);
  console.log(`📍 Output Archive (Dist): ${zipPath} (${sizeKB} KB)`);
  console.log(`📍 Output Archive (Public Web): ${publicZipPath}`);
  console.log(`🚀 Ready for direct web download & store uploads.\n`);
} catch (err) {
  console.error("❌ Failed to create zip archive:", err.message);
  process.exit(1);
}
