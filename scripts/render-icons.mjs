// Renders public/icon.svg to the PNG sizes the web manifest and iOS need.
// Run with `node scripts/render-icons.mjs` after changing the SVG.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const svg = readFileSync(path.join('public', 'icon.svg'), 'utf8');
const browser = await chromium.launch();
for (const [size, file] of [
  [192, 'icon-192.png'],
  [512, 'icon-512.png'],
  [180, 'apple-touch-icon.png'],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  // iOS rounds the corners itself and fills transparency with black, so its icon is square.
  const shape = file.startsWith('apple') ? svg.replace(/ rx="\d+"/, '') : svg;
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${shape.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
  );
  await page.screenshot({ path: path.join('public', file), omitBackground: true });
  await page.close();
  console.log(`[render-icons] ${file}`);
}
await browser.close();
