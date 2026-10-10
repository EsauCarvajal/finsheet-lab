import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { challenges, modules } from '../../src/content/catalog';
import { emptyProgress } from '../../src/storage/progress';

const base = 'http://127.0.0.1:4173';
const language = (page: Page, id = 'ui-language') => page.locator(`#${id}`);
async function navigate(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if ((await menu.isVisible()) && (await menu.getAttribute('aria-expanded')) === 'false')
    await menu.click();
  await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
}
async function solve(page: Page, id: string) {
  const challenge = challenges.find((c) => c.id === id)!;
  await expect(page.getByRole('button', { name: 'Comprobar solución', exact: true })).toBeEnabled();
  await language(page, 'formula-language')
    .getByRole('button', { name: 'English', exact: true })
    .click();
  await expect(
    language(page, 'formula-language').getByRole('button', { name: 'English', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  for (const target of challenge.targets) {
    await page.locator('#selected-cell').selectOption(target.cell);
    await page.getByRole('textbox', { name: 'Fórmula', exact: true }).fill(target.formula);
    await page.getByRole('textbox', { name: 'Fórmula', exact: true }).press('Enter');
  }
}

test('landing has one focus and a syllabus that appears on request', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Domina Excel.Piensa en finanzas.',
  );
  await expect(page.getByRole('complementary')).toHaveCount(0);
  await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(3);
  await expect(page.getByRole('link', { name: /01 Fundamentos financieros/ })).toBeHidden();
  await page.getByText('Ver temario', { exact: true }).click();
  for (const module of modules)
    await expect(page.getByRole('link', { name: new RegExp(module.title.es) })).toBeVisible();
  await page.getByRole('link', { name: /06 Decisiones de inversión/ }).click();
  await expect(page.getByRole('heading', { name: 'Retos de Excel' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Tema', exact: true })).toHaveValue('finance');
  await expect(page.getByRole('link', { name: /Resolver reto:/ })).toHaveCount(4);
  await page.reload();
  await expect(page.getByRole('link', { name: /Resolver reto:/ })).toHaveCount(4);
});

test('language switch works with arrows, Home and End without changing formula language', async ({
  page,
}) => {
  await page.goto('/#learn/logic-01');
  await expect(page.getByRole('button', { name: 'Comprobar solución', exact: true })).toBeEnabled();
  const ui = language(page);
  await ui.getByRole('button', { name: 'Español', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(ui.getByRole('button', { name: 'English', exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Budget traffic light' })).toBeVisible();
  await expect(
    language(page, 'formula-language').getByRole('button', { name: 'Español', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Home');
  await expect(page.getByRole('heading', { name: 'Semáforo de presupuesto' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(ui.getByRole('button', { name: 'English', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('mobile navigation closes with Escape and after choosing a page', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(base);
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await expect(page.getByRole('navigation')).toBeHidden();
  await menu.click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation')).toBeHidden();
  await expect(menu).toBeFocused();
  await navigate(page, 'Mi progreso');
  await expect(page.getByRole('heading', { name: 'Tu progreso' })).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('link', { name: 'FinSheet Lab', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Domina Excel. Piensa en finanzas.' }),
  ).toBeVisible();
  await context.close();
});

test('all screens fit narrow phones, tablets and desktop without page overflow', async ({
  browser,
}) => {
  test.setTimeout(180000);
  for (const width of [320, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    for (const route of ['home', 'catalog', 'cases', 'progress', 'learn/foundation-01']) {
      await page.goto(`${base}/#${route}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const sheet = page.getByRole('button', { name: 'Hoja de trabajo', exact: true });
      if (route.startsWith('learn/') && (await sheet.isVisible())) await sheet.click();
      await expect
        .poll(
          () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
          `${width}px ${route}`,
        )
        .toBeLessThanOrEqual(1);
    }
    await context.close();
  }
});

test('concept and worksheet help expand with the keyboard', async ({ page }) => {
  await page.goto('/#learn/foundation-01');
  const concept = page.getByText('Repasar el concepto', { exact: true });
  const lesson = page.getByText(challenges[0].lesson.es, { exact: true });
  await expect(lesson).toBeHidden();
  await concept.focus();
  await page.keyboard.press('Enter');
  await expect(lesson).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(lesson).toBeHidden();
  const help = page.getByText('Ayuda con la hoja', { exact: true });
  await help.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Doble clic o F2 para editar/)).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Fórmula', exact: true })).toBeEditable();
});

test('hints keep full points and solving twice does not duplicate points', async ({ page }) => {
  await page.goto('/#learn/foundation-01');
  await page.getByRole('button', { name: /Ver una pista/ }).click();
  await page.getByRole('textbox', { name: 'Fórmula', exact: true }).fill('=SUMA(B2:B5)');
  const check = page.getByRole('button', { name: 'Comprobar solución', exact: true });
  await check.click();
  await expect(page.getByRole('heading', { name: '¡Reto completado!' })).toBeVisible();
  await check.click();
  await expect(page.getByRole('heading', { name: '¡Reto completado!' })).toBeVisible();
  await navigate(page, 'Mi progreso');
  await expect(page.getByRole('heading', { name: /10.*720 XP/ })).toBeVisible();
  await page.getByRole('link', { name: 'FinSheet Lab', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Seguir practicando', exact: true })).toHaveAttribute(
    'href',
    '#learn/foundation-02',
  );
});

test('case requires interpretation as well as correct formulas', async ({ page }) => {
  await page.goto('/#learn/case-budget');
  await solve(page, 'case-budget');
  const answer = challenges.find((c) => c.id === 'case-budget')!.interpretation!.answer;
  await page
    .getByRole('radio')
    .nth((answer + 1) % 3)
    .check();
  const check = page.getByRole('button', { name: 'Comprobar solución', exact: true });
  await check.click();
  await expect(
    page.getByText('Revisa la interpretación financiera del caso.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Completado', { exact: true })).toHaveCount(0);
  await page.getByRole('radio').nth(answer).check();
  await check.click();
  await expect(page.getByRole('heading', { name: '¡Reto completado!' })).toBeVisible();
  await navigate(page, 'Mi progreso');
  await expect(page.getByRole('heading', { name: /100.*720 XP/ })).toBeVisible();
});

test('unsupported formulas recover and seed cells remain read only', async ({ page }) => {
  await page.goto('/#learn/foundation-01');
  const input = page.getByRole('textbox', { name: 'Fórmula', exact: true });
  await input.fill('=WEBSERVICE("https://example.com")');
  await input.press('Enter');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Reiniciar hoja', exact: true }).click();
  await expect(input).toHaveValue('');
  await page.getByRole('gridcell', { name: 'Mes', exact: true }).click();
  await expect(input).toHaveJSProperty('readOnly', true);
  await page.locator('#selected-cell').selectOption('B7');
  await expect(input).toBeEditable();
  await input.fill('=SUMA(B2:B5)');
  await page.getByRole('button', { name: 'Comprobar solución', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Reto completado!' })).toBeVisible();
});

test('existing backups restore language and progress immediately after import', async ({
  page,
}) => {
  const state = emptyProgress();
  state.settings = { language: 'en', formulaLanguage: 'en' };
  state.activities['foundation-01'] = {
    version: 1,
    draft: { B7: '=SUM(B2:B5)' },
    formulaLanguage: 'en',
    attempts: 2,
    hints: 1,
    solutionViewed: false,
    completed: true,
    assisted: false,
    updatedAt: new Date().toISOString(),
  };
  await page.goto('/#progress');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Importar respaldo', { exact: true }).setInputFiles({
    name: 'existing-v1.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();
  await expect(page.getByText('1 / 27 completed', { exact: true })).toBeVisible();
  await expect(
    language(page).getByRole('button', { name: 'English', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'FinSheet Lab', exact: true }).click();
  await page.getByRole('link', { name: 'Keep practicing', exact: true }).click();
  await expect(
    language(page, 'formula-language').getByRole('button', { name: 'English', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('cancelled and oversized imports preserve the current session', async ({ page }) => {
  await page.goto('/#progress');
  page.once('dialog', (dialog) => dialog.dismiss());
  const state = emptyProgress();
  state.settings.language = 'en';
  await page.getByLabel('Importar respaldo', { exact: true }).setInputFiles({
    name: 'cancel.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await expect(page.getByRole('heading', { name: 'Tu progreso' })).toBeVisible();
  await page.getByLabel('Importar respaldo', { exact: true }).setInputFiles({
    name: 'too-big.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(1024 * 1024 + 1, 32),
  });
  await expect(page.getByText(/El archivo no es un respaldo compatible/)).toBeVisible();
  await expect(
    language(page).getByRole('button', { name: 'Español', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('cell content is displayed as text and valid practice still works afterwards', async ({
  page,
}) => {
  await page.goto('/#learn/foundation-01');
  const input = page.getByRole('textbox', { name: 'Fórmula', exact: true });
  await input.fill('<img src=x onerror="window.injected=true">');
  await input.press('Enter');
  await expect(
    page.getByRole('gridcell', { name: '<img src=x onerror="window.injected=true">' }),
  ).toBeVisible();
  expect(await page.evaluate(() => Object.hasOwn(window, 'injected'))).toBe(false);
  await expect(page.locator('img')).toHaveCount(0);
  await input.fill('=SUMA(B2:B5)');
  await page.getByRole('button', { name: 'Comprobar solución', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Reto completado!' })).toBeVisible();
});

test('skip link and browser history keep navigation usable with a keyboard', async ({ page }) => {
  await page.goto('/');
  const skip = page.getByRole('link', { name: 'Saltar al contenido', exact: true });
  await skip.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(
    page.getByRole('heading', { name: 'Domina Excel. Piensa en finanzas.' }),
  ).toBeVisible();
  await navigate(page, 'Retos');
  await navigate(page, 'Casos');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Retos de Excel' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Casos de finanzas' })).toBeVisible();
});

test('catalog distinguishes untouched, in-progress and completed exercises', async ({ page }) => {
  await page.goto('/#learn/foundation-01');
  await page.getByRole('textbox', { name: 'Fórmula', exact: true }).fill('=SUMA(B2:B4)');
  await navigate(page, 'Retos');
  const status = page.getByRole('combobox', { name: 'Estado', exact: true });
  await status.selectOption('inProgress');
  await expect(page.getByRole('link', { name: /Resolver reto:/ })).toHaveCount(1);
  await status.selectOption('pending');
  await expect(page.getByRole('link', { name: /Resolver reto:/ })).toHaveCount(26);
  await status.selectOption('completed');
  await expect(page.getByText('No encontramos retos con esos filtros.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
  await expect(page.getByRole('link', { name: /Resolver reto:/ })).toHaveCount(27);
  await page.getByRole('link', { name: 'Resolver reto: El cierre de ventas', exact: true }).click();
  await page.getByRole('textbox', { name: 'Fórmula', exact: true }).fill('=SUMA(B2:B5)');
  await page.getByRole('button', { name: 'Comprobar solución', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Reto completado!' })).toBeVisible();
  await navigate(page, 'Retos');
  await status.selectOption('completed');
  await expect(page.getByRole('link', { name: /Resolver reto:/ })).toHaveCount(1);
});

for (const width of [1440, 390])
  test(`accessible screens and worksheet at ${width}px`, async ({ browser }) => {
    test.setTimeout(180000);
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    for (const route of ['home', 'catalog', 'cases', 'progress', 'about', 'learn/foundation-01']) {
      await page.goto(`${base}/#${route}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      for (const lang of ['Español', 'English']) {
        await language(page).getByRole('button', { name: lang, exact: true }).click();
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(
          result.violations,
          `${width}px ${route} ${lang}: ${JSON.stringify(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.failureSummary) })))}`,
        ).toEqual([]);
      }
      if (route.startsWith('learn/')) {
        const sheet = page.getByRole('button', { name: 'Worksheet', exact: true });
        if (await sheet.isVisible()) await sheet.click();
        await page.getByRole('textbox', { name: 'Formula', exact: true }).fill('=SUMA(B2:B5)');
        await page.getByRole('button', { name: 'Check solution', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Challenge complete!' })).toBeVisible();
        if (width === 1440) {
          await page.getByText('Review the concept', { exact: true }).click();
          await page.getByRole('button', { name: /Show a hint/ }).click();
          await page.getByRole('button', { name: 'Show solution', exact: true }).click();
        }
        const feedback = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(
          feedback.violations,
          `${width}px expanded worksheet: ${JSON.stringify(feedback.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.failureSummary) })))}`,
        ).toEqual([]);
      }
    }
    await context.close();
  });
