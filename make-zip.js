// Pack the HostelHub project as a zip, excluding heavy dirs.
// Usage: node make-zip.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;
const OUT = path.join(ROOT, "HostelHub-v0.1.zip");
const EXCLUDE = new Set(["node_modules", ".next", ".git", "HostelHub-v0.1.zip"]);
const EXCLUDE_FILES = new Set([
  "package-lock.json", // optional, regenerates on install
]);

// Simple ZIP writer using zlib + manual central directory
// To avoid external deps, we use PowerShell's Compress-Archive via a small
// filter step: copy wanted files to a temp dir, then zip.
const tmp = path.join(ROOT, ".pack-tmp");
if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

function shouldExclude(name) {
  return EXCLUDE.has(name) || EXCLUDE_FILES.has(name);
}

function copyDir(src, dst) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    if (shouldExclude(e.name)) continue;
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

console.log("Copying project files…");
copyDir(ROOT, tmp);

console.log("Creating zip via PowerShell Compress-Archive…");
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${tmp}\\*' -DestinationPath '${OUT}' -Force"`,
  { stdio: "inherit" }
);

fs.rmSync(tmp, { recursive: true, force: true });

const size = fs.statSync(OUT).size;
console.log(`\n✓ Created ${path.basename(OUT)} (${(size / 1024).toFixed(1)} KB)`);
