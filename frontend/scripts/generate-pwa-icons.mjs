#!/usr/bin/env node
/**
 * Generates PWA PNG icons from public/favicon.svg
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svg = await readFile(join(publicDir, 'favicon.svg'));

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 },
];

for (const { name, size } of sizes) {
  const pipeline = sharp(svg).resize(size, size);
  if (name.endsWith('.ico')) {
    const png = await pipeline.png().toBuffer();
    await writeFile(join(publicDir, name), png);
  } else {
    await pipeline.png().toFile(join(publicDir, name));
  }
}

console.log('PWA icons generated in public/');
