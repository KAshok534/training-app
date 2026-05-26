// Generates MASKABLE PWA icon variants for Android adaptive icons.
// Run once: node scripts/generate-maskable-icons.mjs
//
// Maskable icon spec (Google):
//   - Square canvas, fully opaque background
//   - "Safe zone" is the central circle of radius 40% of the icon size
//   - Anything outside the safe zone may be cropped to circle/squircle/teardrop
//     by the launcher on Android 8+
//
// Strategy: forest-green background fills the whole icon. AIWMR logo placed
// at 60% width centered (well inside the 80%-diameter safe zone).
//
// Output (all in public/icons/):
//   maskable-192x192.png
//   maskable-512x512.png

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const SRC       = resolve(ROOT, 'public', 'logo.png');  // transparent AIWMR logo
const OUT       = resolve(ROOT, 'public', 'icons');

// Forest brand color
const FOREST = { r: 0x1a, g: 0x3a, b: 0x2a, alpha: 1 };

async function makeMaskable(size, outputPath) {
  // Logo at 60% of canvas width → 20% padding each side → well inside 80% safe zone
  const logoWidth = Math.round(size * 0.6);

  // Resize the transparent logo (keep aspect ratio — height auto-derives)
  const logoBuf = await sharp(SRC)
    .resize({
      width:      logoWidth,
      fit:        'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Composite onto a solid forest-green square
  await sharp({
    create: {
      width:      size,
      height:     size,
      channels:   4,
      background: FOREST,
    },
  })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .png()
    .toFile(outputPath);

  console.log(`✅  maskable ${size}×${size}  →  ${outputPath}`);
}

await makeMaskable(512, `${OUT}/maskable-512x512.png`);
await makeMaskable(192, `${OUT}/maskable-192x192.png`);

console.log('\nMaskable icons generated successfully 🎉');
console.log('Remember: manifest.json + vite.config.ts have been updated to reference them.');
