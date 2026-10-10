import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.cache/browsers');
const { chromium } = await import('@playwright/test');
const origin = process.env.CAPTURE_URL ?? 'http://127.0.0.1:4173';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1080 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
await page.goto(origin);
await page.getByRole('heading', { name: 'Domina Excel. Piensa en finanzas.' }).waitFor();
await page.screenshot({ path: 'artifacts/home-desktop.png', fullPage: true });
await page.goto(`${origin}/#learn/foundation-01`);
await page.getByRole('button', { name: 'Comprobar solución', exact: true }).waitFor();
await page.getByRole('textbox', { name: 'Fórmula', exact: true }).fill('=SUMA(B2:B5)');
await page.getByRole('textbox', { name: 'Fórmula', exact: true }).press('Enter');
await page.getByRole('button', { name: 'Comprobar solución', exact: true }).click();
await page.getByRole('heading', { name: '¡Reto completado!' }).waitFor();
await page.screenshot({ path: 'artifacts/practice-desktop.png', fullPage: true });
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  storageState: await page.context().storageState({ indexedDB: true }),
  reducedMotion: 'reduce',
});
await mobile.goto(`${origin}/#home`);
await mobile.getByRole('heading', { name: 'Domina Excel. Piensa en finanzas.' }).waitFor();
await mobile.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
await browser.close();
console.log('Screenshots saved in artifacts/');
