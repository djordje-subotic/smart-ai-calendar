#!/usr/bin/env node
/**
 * Generate all Kron-branded mobile icons from a single SVG source.
 *
 * Outputs (all PNG, into ./assets):
 *   icon.png           1024×1024  — iOS app icon
 *   adaptive-icon.png  1024×1024  — Android adaptive foreground
 *   splash-icon.png    1024×1024  — splash logo
 *   favicon.png        48×48      — web favicon
 *   notification-icon.png 96×96   — Android notification status-bar icon (monochrome)
 *
 * Usage:
 *   cd mobile && node scripts/generate-icons.mjs
 *
 * Relies on `sharp` from the repo root (it's a peer dep of next/og we already
 * have). If sharp isn't found, the script prints a helpful message.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsDir = resolve(__dirname, "..", "assets");

let sharp;
try {
  // Reach up to repo root where sharp is installed (next/og transitively pulls it)
  const root = resolve(__dirname, "..", "..");
  sharp = (await import(resolve(root, "node_modules", "sharp", "lib", "index.js"))).default;
} catch {
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error(
      "❌ sharp is not installed. Run `npm i -D sharp` in the repo root or mobile folder."
    );
    process.exit(1);
  }
}

mkdirSync(assetsDir, { recursive: true });

// SVG templates ----------------------------------------------------------------

const brandGradient = `
  <defs>
    <radialGradient id="glow" cx="30%" cy="20%" r="90%">
      <stop offset="0%" stop-color="rgba(245,158,11,0.55)"/>
      <stop offset="60%" stop-color="rgba(245,158,11,0.0)"/>
    </radialGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f0b15"/>
      <stop offset="60%" stop-color="#1a1525"/>
      <stop offset="100%" stop-color="#2a1f1a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>`;

/** Crown icon path — simple stylized crown silhouette */
function crownPath(cx, cy, size) {
  const s = size;
  // Starting at top-left of crown base, going across
  return `
    <path d="
      M ${cx - s * 0.45} ${cy + s * 0.3}
      L ${cx - s * 0.45} ${cy + s * 0.05}
      L ${cx - s * 0.3} ${cy - s * 0.25}
      L ${cx - s * 0.15} ${cy + s * 0.0}
      L ${cx} ${cy - s * 0.35}
      L ${cx + s * 0.15} ${cy + s * 0.0}
      L ${cx + s * 0.3} ${cy - s * 0.25}
      L ${cx + s * 0.45} ${cy + s * 0.05}
      L ${cx + s * 0.45} ${cy + s * 0.3}
      Z
    "
    fill="url(#gold)"
    stroke="#FBBF24"
    stroke-width="${s * 0.02}"
    stroke-linejoin="round"/>
    <circle cx="${cx - s * 0.3}" cy="${cy - s * 0.28}" r="${s * 0.05}" fill="#FBBF24"/>
    <circle cx="${cx}" cy="${cy - s * 0.38}" r="${s * 0.06}" fill="#FBBF24"/>
    <circle cx="${cx + s * 0.3}" cy="${cy - s * 0.28}" r="${s * 0.05}" fill="#FBBF24"/>
  `;
}

function appIconSvg(size) {
  const radius = size * 0.22; // iOS apply square; android masks; just a visual radius
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${brandGradient}
    <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bg)"/>
    <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#glow)"/>
    ${crownPath(size / 2, size * 0.48, size * 0.72)}
  </svg>`;
}

function splashSvg(size) {
  // Same crown but on a solid background (splash bg is already #0f0b15 from app.json)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${brandGradient}
    ${crownPath(size / 2, size / 2, size * 0.8)}
  </svg>`;
}

function adaptiveForegroundSvg(size) {
  // Android adaptive icon foreground — safe area is inner 66%. Keep crown tight.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${brandGradient}
    ${crownPath(size / 2, size / 2, size * 0.55)}
  </svg>`;
}

function notificationIconSvg(size) {
  // Android wants a single-color silhouette for the status bar
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <path d="
      M ${size * 0.12} ${size * 0.72}
      L ${size * 0.12} ${size * 0.55}
      L ${size * 0.25} ${size * 0.3}
      L ${size * 0.35} ${size * 0.5}
      L ${size / 2} ${size * 0.22}
      L ${size * 0.65} ${size * 0.5}
      L ${size * 0.75} ${size * 0.3}
      L ${size * 0.88} ${size * 0.55}
      L ${size * 0.88} ${size * 0.72}
      Z" fill="#FFFFFF"/>
  </svg>`;
}

async function render(svg, outPath, pngSize) {
  const buf = Buffer.from(svg);
  await sharp(buf).resize(pngSize, pngSize).png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`  ✓ ${outPath.replace(assetsDir, "assets")} (${pngSize}×${pngSize})`);
}

console.log(`Generating Kron mobile icons into ${assetsDir} …`);
await render(appIconSvg(1024), resolve(assetsDir, "icon.png"), 1024);
await render(adaptiveForegroundSvg(1024), resolve(assetsDir, "adaptive-icon.png"), 1024);
await render(splashSvg(1024), resolve(assetsDir, "splash-icon.png"), 1024);
await render(appIconSvg(48), resolve(assetsDir, "favicon.png"), 48);
await render(notificationIconSvg(96), resolve(assetsDir, "notification-icon.png"), 96);
console.log("✅ Done. Run `expo prebuild` or just rebuild to pick them up.");
