import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.cache/browsers');
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(
  `<html><body style="margin:0">${await readFile('public/social-preview.svg', 'utf8')}</body></html>`,
);
await page.screenshot({ path: 'public/social-preview.png' });
await browser.close();
console.log('Created public/social-preview.png (1200 × 630).');
