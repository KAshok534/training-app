// Generates course logo PNGs for use inside the app (course cards + detail pages).
// Run: node scripts/generate-course-logos.mjs
//
// Strategy: remove the white background by converting white pixels to transparent.
// This avoids needing mix-blend-mode in CSS and works in ALL browsers.
//
// Add new courses here as the client provides more logos.

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT    = resolve(__dirname, '..', '..', 'Client images');
const OUT_DIR   = resolve(__dirname, '..', 'public', 'course-logos');

mkdirSync(OUT_DIR, { recursive: true });

// White-removal threshold: pixels where R,G,B are all >= this value become transparent
const THRESHOLD = 240;

async function generateCourseLogo(srcFile, outFile, targetWidth = 600) {
  const { data, info } = await sharp(srcFile)
    .resize({ width: targetWidth, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  const pixels = new Uint8ClampedArray(data.buffer);

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
    .toFile(outFile);

  const meta = await sharp(outFile).metadata();
  console.log(`✅  ${outFile}  (${meta.width} × ${meta.height})`);
}

// ── Course logos ──────────────────────────────────────────────────────────────
await generateCourseLogo(
  `${CLIENT}/CEWM flagship course logo.jpeg`,
  `${OUT_DIR}/cewm.png`,
);

// Add more courses here when client provides logos:
// await generateCourseLogo(`${CLIENT}/ISWM logo.jpeg`, `${OUT_DIR}/iswm.png`);

console.log('\nAll course logos generated 🎉');
