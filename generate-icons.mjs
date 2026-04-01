#!/usr/bin/env node
// Run this script once: node generate-icons.mjs
// Then replace with your real AIWMR logo PNG

import { writeFileSync } from 'fs';
import { createCanvas } from 'canvas'; // npm install canvas (only for icon generation)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1a3a2a';
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Leaf emoji approximation
  ctx.fillStyle = '#6aad78';
  ctx.font = `bold ${size * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌿', size / 2, size / 2);

  writeFileSync(`public/icons/icon-${size}.png`, canvas.toBuffer('image/png'));
  console.log(`Generated icon-${size}.png`);
}
