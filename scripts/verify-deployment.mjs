import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.cache/browsers');
const { chromium, firefox, webkit } = await import('@playwright/test');
const origin = new URL(process.env.SITE_URL ?? 'https://finsheet-lab.pages.dev').origin;
const response = await fetch(origin);
assert.equal(response.status, 200);
assert.match(response.headers.get('content-security-policy') ?? '', /wasm-unsafe-eval/);
assert.match(response.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
assert.equal(response.headers.get('x-frame-options'), 'DENY');
assert.match(
  await response.text(),
  new RegExp(`${origin.replaceAll('.', '\\.')}/social-preview.png`),
);
assert.equal((await fetch(`${origin}/social-preview.png`)).status, 200);
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    const external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => {
      if (new URL(r.url()).origin !== origin) external.push(r.url());
    });
    await page.goto(`${origin}/#learn/foundation-01`);
    await page.getByRole('textbox', { name: 'Fórmula', exact: true }).fill('=SUMA(B2:B5)');
    await page.getByRole('button', { name: 'Comprobar solución', exact: true }).click();
    await page.getByRole('heading', { name: '¡Reto completado!' }).waitFor();
    await page.reload();
    await page.getByText('Completado', { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(`${name}: HTTPS, formula calculation and saved progress passed`);
  } finally {
    await browser.close();
  }
}
console.log('Deployment headers and social metadata passed');
