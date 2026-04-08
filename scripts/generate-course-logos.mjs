// Generates course logo PNGs for use inside the app (course cards + detail pages).
// Run: node scripts/generate-course-logos.mjs
// Add new courses here as the client provides more logos.

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT    = resolve(__dirname, '..', '..', 'Client images');
const OUT_DIR   = resolve(__dirname, '..', 'public', 'course-logos');

mkdirSync(OUT_DIR, { recursive: true });

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function generateCourseLogo(srcFile, outFile, targetWidth = 600) {
  const pad = Math.round(targetWidth * 0.06);
  const innerW = targetWidth - pad * 2;
  await sharp(srcFile)
    .resize({ width: innerW, fit: 'inside', background: WHITE })
    .flatten({ background: WHITE })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: WHITE })
    .resize(targetWidth)
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
