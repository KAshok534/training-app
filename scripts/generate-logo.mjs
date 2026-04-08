// Generates public/logo.png — full rectangular AIWMR logo for use inside the app
// (login screen, about page, etc.)
// Run: node scripts/generate-logo.mjs

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', '..', 'Client images', 'aiwmr logo.jpeg');
const OUT = resolve(__dirname, '..', 'public', 'logo.png');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

// 600 × 245 px — clean rectangular version with 6% padding on all sides
const TARGET_W = 600;
const PAD      = Math.round(TARGET_W * 0.06);
const INNER_W  = TARGET_W - PAD * 2;

await sharp(SRC)
  .resize({ width: INNER_W, fit: 'inside', background: WHITE })
  .flatten({ background: WHITE })
  .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: WHITE })
  .resize(TARGET_W)          // enforce exact width after extend
  .png()
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`✅  logo.png  →  ${OUT}  (${meta.width} × ${meta.height})`);
