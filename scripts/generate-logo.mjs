// Generates public/logo.png — full rectangular AIWMR logo for use inside the app
// (login screen, about page, etc.)
// Run: node scripts/generate-logo.mjs
//
// Strategy: remove the white background by converting white pixels to transparent.
// This avoids needing mix-blend-mode in CSS and works in ALL browsers.

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', '..', 'Client images', 'aiwmr logo.jpeg');
const OUT = resolve(__dirname, '..', 'public', 'logo.png');

// 1. Resize to 600px wide (keeping proportions)
// 2. Ensure alpha channel exists
// 3. Use raw pixel manipulation to turn near-white pixels transparent
const TARGET_W = 600;

const { data, info } = await sharp(SRC)
  .resize({ width: TARGET_W, fit: 'inside' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info; // channels = 4 (RGBA)
const pixels = new Uint8ClampedArray(data.buffer);

// White-removal threshold: pixels where R,G,B are all >= 240 become transparent
const THRESHOLD = 240;

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
    pixels[i + 3] = 0; // fully transparent
  }
}

await sharp(Buffer.from(pixels.buffer), {
  raw: { width, height, channels },
})
  .png()
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`✅  logo.png  →  ${OUT}  (${meta.width} × ${meta.height})`);
