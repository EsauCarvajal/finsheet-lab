import { test, expect } from '@playwright/test';
import { challenges } from '../../src/content/catalog';

test('home, catalog filters, cases, language and responsive layout', async ({ page, browser }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Domina Excel. Piensa en finanzas.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Ver los retos' }).click();
  await expect(page.getByRole('link', { name: /Resolver reto/ })).toHaveCount(27);
  await page.getByRole('combobox', { name: 'Tema', exact: true }).selectOption('finance');
  await expect(page.getByRole('link', { name: /Resolver reto/ })).toHaveCount(4);
  await page.getByRole('combobox', { name: 'Dificultad', exact: true }).selectOption('easy');
  await expect(page.getByRole('link', { name: /Resolver reto/ })).toHaveCount(2);
  await page.locator('#ui-language').getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Excel challenges' })).toBeVisible();
  await page.getByRole('link', { name: 'Cases', exact: true }).click();
  await expect(page.getByRole('link', { name: /Solve challenge/ })).toHaveCount(3);
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto('http://127.0.0.1:4173');
  await expect(
    mobile.getByRole('heading', { name: 'Domina Excel. Piensa en finanzas.' }),
  ).toBeVisible();
  expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
    true,
  );
  await mobile.getByRole('button', { name: 'Menu', exact: true }).click();
  await mobile.getByRole('link', { name: 'Mi progreso', exact: true }).click();
  await expect(mobile.getByRole('heading', { name: 'Tu progreso' })).toBeVisible();
  await mobile.close();
  expect(errors).toEqual([]);
});

test('solve, persist, export, delete and restore progress', async ({ page }) => {
  await page.goto('/#learn/foundation-01');
  await expect(page.getByRole('button', { name: 'Comprobar solución', exact: true })).toBeEnabled();
  await page.getByRole('textbox', { name: 'Fórmula', exact: true }).fill('=B2+B3+B4+B5');
  await page.getByRole('button', { name: 'Comprobar solución', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Reto completado!' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Completado', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Fórmula', exact: true })).toHaveValue(
    '=B2+B3+B4+B5',
  );
  await page.getByRole('link', { name: 'Mi progreso', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar respaldo', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Borrar mi progreso', exact: true }).click();
  await expect(page.getByText('0 / 27 completados', { exact: true })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Importar respaldo', { exact: true }).setInputFiles(path!);
  await expect(page.getByText('Respaldo importado correctamente.')).toBeVisible();
  await expect(page.getByText('1 / 27 completados', { exact: true })).toBeVisible();
  await page.getByLabel('Importar respaldo', { exact: true }).setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":9}'),
  });
  await expect(page.getByText(/El archivo no es un respaldo compatible/)).toBeVisible();
  await expect(page.getByText('1 / 27 completados', { exact: true })).toBeVisible();
});

test('formula errors, constant rejection, hints and assisted completion', async ({ page }) => {
  await page.goto('/#learn/foundation-01');
  const input = page.getByRole('textbox', { name: 'Fórmula', exact: true });
  const check = page.getByRole('button', { name: 'Comprobar solución', exact: true });
  await expect(check).toBeEnabled();
  await input.fill('60000');
  await check.click();
  await expect(page.getByText('Escribe una fórmula que empiece por =.')).toBeVisible();
  await input.fill('=60000');
  await check.click();
  await expect(page.getByText(/Funciona con estos datos, pero falla/)).toBeVisible();
  await input.fill('=1/0');
  await check.click();
  await expect(page.getByText(/La fórmula produce un error/)).toBeVisible();
  await page.getByRole('button', { name: /Ver una pista/ }).click();
  await page.getByRole('button', { name: /Ver una pista/ }).click();
  await expect(page.getByRole('button', { name: /Ver una pista/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Ver solución', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Una forma de resolverlo' })).toBeVisible();
  await input.fill('=SUMA(B2:B5)');
  await check.click();
  await expect(page.getByText('Resolución asistida', { exact: true })).toBeVisible();
});

test('native formula translation preserves literal text and interface independence', async ({
  page,
}) => {
  await page.goto('/#learn/logic-01');
  await expect(page.getByRole('button', { name: 'Comprobar solución', exact: true })).toBeEnabled();
  const input = page.getByRole('textbox', { name: 'Fórmula', exact: true });
  await input.fill('=SI(C2>B2;"SUM IF";"OK")');
  await input.press('Enter');
  await page
    .locator('#formula-language')
    .getByRole('button', { name: 'English', exact: true })
    .click();
  await expect(input).toHaveValue('=IF(C2>B2,"SUM IF","OK")');
  await expect(page.getByRole('heading', { name: 'Semáforo de presupuesto' })).toBeVisible();
  await page.locator('#ui-language').getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Budget traffic light' })).toBeVisible();
  await expect(
    page.locator('#formula-language').getByRole('button', { name: 'English', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('worksheet supports keyboard cell editing on mobile', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:4173/#learn/foundation-01');
  await page.getByRole('button', { name: 'Hoja de trabajo', exact: true }).click();
  await page.getByRole('textbox', { name: 'Fórmula', exact: true }).fill('=SUMA(B2:B5)');
  await page.getByRole('textbox', { name: 'Fórmula', exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: 'Comprobar solución', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Comprobar solución', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Reto completado!' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByText('Guardado', { exact: true })).toBeVisible();
  const storageState = await page.context().storageState({ indexedDB: true });
  await page.close();
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 }, storageState });
  await desktop.goto('http://127.0.0.1:4173/#learn/foundation-01');
  const target = desktop.getByRole('gridcell', { name: '60.000,00' });
  await target.click();
  await target.press('F2');
  await expect(desktop.getByRole('textbox', { name: 'Formula B7' })).toBeVisible();
  await desktop.getByRole('textbox', { name: 'Formula B7' }).fill('=SUMA(B2:B5)');
  await desktop.getByRole('textbox', { name: 'Formula B7' }).press('Enter');
  await desktop.close();
});

test('all 27 activities can be completed through the interface', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Domina Excel. Piensa en finanzas.' }),
  ).toBeVisible();
  await page.locator('#ui-language').getByRole('button', { name: 'English', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Master Excel. Think in finance.' }),
  ).toBeVisible();
  for (const c of challenges) {
    await page.evaluate((id) => {
      location.hash = `learn/${id}`;
    }, c.id);
    const check = page.getByRole('button', { name: 'Check solution', exact: true });
    await expect(check).toBeEnabled();
    await page
      .locator('#formula-language')
      .getByRole('button', { name: 'English', exact: true })
      .click();
    for (const target of c.targets) {
      await page.locator('#selected-cell').selectOption(target.cell);
      await page.getByRole('textbox', { name: 'Formula', exact: true }).fill(target.formula);
      await page.getByRole('textbox', { name: 'Formula', exact: true }).press('Enter');
    }
    if (c.interpretation) await page.getByRole('radio').nth(c.interpretation.answer).check();
    await check.click();
    await expect(page.getByRole('heading', { name: 'Challenge complete!' }), c.id).toBeVisible();
  }
  await page.getByRole('link', { name: 'My progress', exact: true }).click();
  await expect(page.getByText('27 / 27 completed', { exact: true })).toBeVisible();
  await expect(page.getByText('Earned', { exact: true })).toHaveCount(7);
});

test('blocked storage is recoverable without losing the ability to practice', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new Error('Storage blocked');
      },
    });
  });
  await page.goto('/#learn/foundation-01');
  await expect(page.getByText(/El navegador no permite guardar/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Comprobar solución', exact: true })).toBeEnabled();
  await page.getByRole('textbox', { name: 'Fórmula', exact: true }).fill('=SUMA(B2:B5)');
  await page.getByRole('button', { name: 'Comprobar solución', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Reto completado!' })).toBeVisible();
});

test('unsubmitted drafts and language survive closing the browser context', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/#learn/foundation-01');
  await expect(
    page.locator('#ui-language').getByRole('button', { name: 'English', exact: true }),
  ).toBeEnabled();
  await page.locator('#ui-language').getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('=SUMA(B2:B5)');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const r = indexedDB.open('finsheet-lab');
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
        try {
          return await new Promise<string | undefined>((resolve, reject) => {
            const r = db.transaction('state').objectStore('state').get('progress');
            r.onsuccess = () =>
              resolve(
                r.result?.settings.language === 'en'
                  ? r.result?.activities['foundation-01']?.draft.B7
                  : undefined,
              );
            r.onerror = () => reject(r.error);
          });
        } finally {
          db.close();
        }
      }),
    )
    .toBe('=SUMA(B2:B5)');
  const storageState = await context.storageState({ indexedDB: true });
  await context.close();
  const restored = await browser.newContext({ storageState });
  const restoredPage = await restored.newPage();
  await restoredPage.goto('http://127.0.0.1:4173/#learn/foundation-01');
  await expect(restoredPage.getByRole('heading', { name: 'The sales close' })).toBeVisible();
  await expect(restoredPage.getByRole('textbox', { name: 'Formula', exact: true })).toHaveValue(
    '=SUMA(B2:B5)',
  );
  await restored.close();
});
