// Generates all PWA + favicon icons from the AIWMR logo JPEG.
// Run once: node scripts/generate-icons.mjs
//
// Output (all in public/icons/):
//   android-chrome-512x512.png  — PWA home screen (large)
//   android-chrome-192x192.png  — PWA home screen (standard)
//   apple-touch-icon.png        — iOS home screen (180×180)
//   favicon-32x32.png           — Browser tab
//   favicon-16x16.png           — Browser tab (small)
//   favicon.ico                 — Legacy browsers

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const SRC       = resolve(ROOT, '..', 'Client images', 'aiwmr logo.jpeg');
const OUT       = resolve(ROOT, 'public', 'icons');

// White background (#ffffff) — matches logo's own background colour
const BG = { r: 255, g: 255, b: 255, alpha: 1 };

// ── Helper: resize logo to fit inside a square canvas with white padding ───────
async function makeSquare(size, outputPath) {
  await sharp(SRC)
    .resize({
      width:  Math.round(size * 0.82),   // 82 % of canvas — leaves clean border
      height: Math.round(size * 0.82),
      fit:    'inside',                  // preserve aspect ratio
      background: BG,
    })
    .flatten({ background: BG })         // fill transparency (if any) with white
    .extend({
      top:    Math.round(size * 0.09),
      bottom: Math.round(size * 0.09),
      left:   Math.round(size * 0.09),
      right:  Math.round(size * 0.09),
      background: BG,
    })
    .resize(size, size)                  // enforce exact final size
    .png()
    .toFile(outputPath);

  console.log(`✅  ${size}×${size}  →  ${outputPath}`);
}

// ── Generate all sizes ─────────────────────────────────────────────────────────
await makeSquare(512, `${OUT}/android-chrome-512x512.png`);
await makeSquare(192, `${OUT}/android-chrome-192x192.png`);
await makeSquare(180, `${OUT}/apple-touch-icon.png`);
await makeSquare(32,  `${OUT}/favicon-32x32.png`);
await makeSquare(16,  `${OUT}/favicon-16x16.png`);

// ── favicon.ico (16px embedded) ────────────────────────────────────────────────
// sharp can't write .ico directly; embed the 32px PNG data as a simple ICO file
const png32 = await sharp(SRC)
  .resize({ width: 32, height: 32, fit: 'contain', background: BG })
  .flatten({ background: BG })
  .png()
  .toBuffer();

// Minimal ICO wrapper: 1 image, 32×32, 32-bit colour
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0,  0); // reserved
icoHeader.writeUInt16LE(1,  2); // type: ICO
icoHeader.writeUInt16LE(1,  4); // 1 image

const icoEntry = Buffer.alloc(16);
icoEntry.writeUInt8(32,      0); // width
icoEntry.writeUInt8(32,      1); // height
icoEntry.writeUInt8(0,       2); // palette
icoEntry.writeUInt8(0,       3); // reserved
icoEntry.writeUInt16LE(1,    4); // planes
icoEntry.writeUInt16LE(32,   6); // bit count
icoEntry.writeUInt32LE(png32.length, 8);  // size of image data
icoEntry.writeUInt32LE(6 + 16,      12); // offset of image data

writeFileSync(`${OUT}/favicon.ico`, Buffer.concat([icoHeader, icoEntry, png32]));
console.log(`✅  favicon.ico  →  ${OUT}/favicon.ico`);

console.log('\nAll icons generated successfully 🎉');
