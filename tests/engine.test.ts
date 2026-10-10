import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { initSync } from '@ironcalc/wasm';
import { challenges, modules } from '../src/content/catalog';
import { calculateView, evaluateChallenge, translateDraft } from '../src/engine/core';

beforeAll(() =>
  initSync({
    module: readFileSync(new URL('../node_modules/@ironcalc/wasm/wasm_bg.wasm', import.meta.url)),
  }),
);
describe('catalog and genuine spreadsheet calculation', () => {
  it('has 24 bilingual challenges and 3 cases with complete educational content', () => {
    expect(challenges).toHaveLength(27);
    expect(new Set(challenges.map((c) => c.id)).size).toBe(27);
    for (const m of modules) {
      const group = challenges.filter((c) => c.module === m.id);
      expect(group.map((c) => c.difficulty)).toEqual(['easy', 'easy', 'medium', 'hard']);
    }
    for (const c of challenges)
      for (const lang of ['en', 'es'] as const) {
        for (const part of [c.title, c.lesson, c.task, c.explanation, ...c.hints])
          expect(part[lang].length).toBeGreaterThan(5);
        expect(c.variants.length).toBeGreaterThanOrEqual(2);
      }
  });
  for (const c of challenges)
    it(`${c.id}: reference answers pass in English and Spanish across variants`, () => {
      const draft = Object.fromEntries(c.targets.map((t) => [t.cell, t.formula]));
      const en = evaluateChallenge(c, draft, 'en', c.interpretation?.answer);
      expect(en, en.checks.map((v) => `${v.cell}:${v.reason}`).join(',')).toMatchObject({
        passed: true,
      });
      const es = translateDraft(c, draft, 'en', 'es');
      expect(evaluateChallenge(c, es, 'es', c.interpretation?.answer).passed).toBe(true);
      expect(translateDraft(c, es, 'es', 'en')).toEqual(draft);
    });
  it('accepts a different correct formula, rejects constants and fake formulas', () => {
    const c = challenges[0];
    expect(evaluateChallenge(c, { B7: '=B2+B3+B4+B5' }, 'en').passed).toBe(true);
    expect(evaluateChallenge(c, { B7: '60000' }, 'en').checks[0].reason).toBe('formula');
    expect(evaluateChallenge(c, { B7: '=60000' }, 'en').checks[0].reason).toBe('variant');
    expect(evaluateChallenge(c, { B7: '=SUM(B2:B4)' }, 'en').passed).toBe(false);
  });
  it('preserves quoted literals when switching formula language and handles Spanish decimals', () => {
    const c = challenges.find((c) => c.id === 'logic-01')!;
    const translated = translateDraft(c, { D2: '=IF(C2>B2,"SUM, IF; 1.2","OK")' }, 'en', 'es');
    expect(translated.D2).toContain('"SUM, IF; 1.2"');
    expect(translateDraft(c, translated, 'es', 'en').D2).toBe('=IF(C2>B2,"SUM, IF; 1.2","OK")');
    const rate = challenges.find((c) => c.id === 'logic-04')!;
    expect(
      evaluateChallenge(
        rate,
        translateDraft(rate, { D2: rate.targets[0].formula }, 'en', 'es'),
        'es',
      ).passed,
    ).toBe(true);
  });
  it('checks independent numerical and financial expectations', () => {
    const compute = (id: string) => {
      const c = challenges.find((c) => c.id === id)!;
      return calculateView(c, Object.fromEntries(c.targets.map((t) => [t.cell, t.formula])), 'en')
        .values;
    };
    expect(Number(compute('foundation-01').B7)).toBe(60000);
    expect(Number(compute('foundation-02').B5)).toBeCloseTo(0.35, 10);
    expect(Number(compute('foundation-04').B7)).toBeCloseTo(13.83, 2);
    expect(Number(compute('finance-01').B6)).toBeCloseTo(1066.185464, 4);
    expect(Number(compute('finance-03').B9)).toBeCloseTo(
      -10000 + 4000 / 1.1 + 4500 / 1.1 ** 2 + 5000 / 1.1 ** 3,
      6,
    );
    const cash = compute('case-cash');
    expect(Number(cash.B11)).toBe(-3000);
    expect(Number(cash.E7)).toBe(12000);
  });
  it('requires correct interpretation on integrated cases', () => {
    const c = challenges.find((c) => c.id === 'case-budget')!;
    expect(
      evaluateChallenge(c, Object.fromEntries(c.targets.map((t) => [t.cell, t.formula])), 'en', 1)
        .passed,
    ).toBe(false);
  });
  it('enforces absolute references when they are the learning objective', () => {
    const c = challenges.find((c) => c.id === 'foundation-03')!;
    const draft = Object.fromEntries(c.targets.map((t) => [t.cell, t.formula.replaceAll('$', '')]));
    expect(
      evaluateChallenge(c, draft, 'en').checks.every((check) => check.reason === 'reference'),
    ).toBe(true);
  });
  it('blocks external access, unsupported functions, oversize formulas and distant references', () => {
    const c = challenges[0];
    for (const formula of [
      '=WEBSERVICE("https://example.com")',
      '=SUM(A1:A1048576)',
      '=Sheet2!B2',
      '=HYPERLINK("https://example.com")',
      '=' + '1+'.repeat(300) + '1',
    ])
      expect(() => calculateView(c, { B7: formula }, 'en')).toThrow();
    expect(() => calculateView(c, { A1: 'x' }, 'en')).toThrow('INVALID_DRAFT');
  });
  it('surfaces formula errors without crashing the engine', () => {
    expect(evaluateChallenge(challenges[0], { B7: '=1/0' }, 'en').checks[0].reason).toBe('error');
    expect(evaluateChallenge(challenges[0], { B7: '=SUM(B2:B5)' }, 'en').passed).toBe(true);
  });
});
