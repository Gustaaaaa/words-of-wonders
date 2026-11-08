// Gera os PNGs dos ícones a partir de tools/icon.svg (usa o Chromium do Playwright).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'tools/icon.svg'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const sizes = [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['apple-touch-icon.png', 180, 0],
  ['icon-maskable-512.png', 512, 0.1],
];
for (const [name, size, pad] of sizes) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@900&display=block" rel="stylesheet"></head>
    <body style="margin:0;background:#9fc8e4;display:grid;place-items:center;width:${size}px;height:${size}px">
    <div style="width:${pad ? size : inner}px;height:${pad ? size : inner}px">${svg.replace('<svg ', `<svg width="100%" height="100%" `)}</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(root, 'icons', name), omitBackground: false });
}
await browser.close();
console.log('ícones gerados em icons/');
