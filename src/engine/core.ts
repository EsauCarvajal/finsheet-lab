import { Model, getTokens } from '@ironcalc/wasm';
import type { Cells, ChallengeDefinition, EngineView, EvaluationResult, Language } from '../types';

export const ALLOWED_FUNCTIONS = new Set([
  'SUM',
  'AVERAGE',
  'ROUND',
  'SUMPRODUCT',
  'IF',
  'AND',
  'OR',
  'NOT',
  'IFERROR',
  'IFNA',
  'SUMIF',
  'SUMIFS',
  'COUNTIF',
  'COUNTIFS',
  'COUNT',
  'COUNTA',
  'XLOOKUP',
  'VLOOKUP',
  'HLOOKUP',
  'INDEX',
  'MATCH',
  'ABS',
  'MIN',
  'MAX',
  'TRIM',
  'UPPER',
  'LOWER',
  'LEFT',
  'RIGHT',
  'MID',
  'LEN',
  'CONCAT',
  'CONCATENATE',
  'DATE',
  'EOMONTH',
  'YEAR',
  'MONTH',
  'DAY',
  'PMT',
  'PV',
  'FV',
  'NPV',
  'IRR',
]);
export function address(cell: string): [number, number] {
  const match = /^([A-Z])([1-9]\d?)$/.exec(cell);
  if (!match) throw new Error('INVALID_CELL');
  return [Number(match[2]), match[1].charCodeAt(0) - 64];
}
function write(model: Model, cells: Cells) {
  for (const [cell, value] of Object.entries(cells)) {
    const [r, c] = address(cell);
    model.setUserInput(0, r, c, value);
  }
}
function validateFormula(formula: string) {
  if (formula.length > 512) throw new Error('FORMULA_LIMIT');
  if (!formula.startsWith('=')) return;
  const tokens = getTokens(formula);
  if (tokens.length > 180) throw new Error('FORMULA_LIMIT');
  for (const { token } of tokens) {
    if (typeof token === 'string') {
      if (['Bang', 'LeftBracket', 'RightBracket', 'LeftBrace', 'RightBrace'].includes(token))
        throw new Error('EXTERNAL_REFERENCE');
      continue;
    }
    if ('Ident' in token && !ALLOWED_FUNCTIONS.has(token.Ident.toUpperCase()))
      throw new Error('UNSUPPORTED_FUNCTION');
    if ('Reference' in token) {
      const ref = token.Reference;
      if (ref.sheet || ref.row < 1 || ref.row > 99 || ref.column < 1 || ref.column > 26)
        throw new Error('REFERENCE_LIMIT');
    }
    if ('Range' in token) {
      const range = token.Range;
      if (
        range.sheet ||
        [range.left, range.right].some(
          (r) => r.row < 1 || r.row > 99 || r.column < 1 || r.column > 26,
        )
      )
        throw new Error('REFERENCE_LIMIT');
    }
  }
}
function baseModel(seed: Cells) {
  const m = new Model('FinSheet', 'en', 'UTC', 'en');
  m.pauseEvaluation();
  write(m, seed);
  return m;
}
export function canonicalDraft(
  challenge: ChallengeDefinition,
  draft: Cells,
  language: Language,
): Cells {
  const m = baseModel(challenge.seed);
  try {
    m.setLanguage(language);
    m.setLocale(language);
    for (const [cell, input] of Object.entries(draft)) {
      if (!challenge.targets.some((t) => t.cell === cell) || input.length > 512)
        throw new Error('INVALID_DRAFT');
      address(cell);
    }
    write(m, draft);
    m.setLanguage('en');
    m.setLocale('en');
    const output: Cells = {};
    for (const cell of Object.keys(draft)) {
      const [r, c] = address(cell);
      const value = m.getCellContent(0, r, c);
      validateFormula(value);
      output[cell] = value;
    }
    return output;
  } finally {
    m.free();
  }
}
export function translateDraft(
  challenge: ChallengeDefinition,
  draft: Cells,
  from: Language,
  to: Language,
): Cells {
  const canonical = canonicalDraft(challenge, draft, from);
  const m = baseModel(challenge.seed);
  try {
    write(m, canonical);
    m.setLanguage(to);
    m.setLocale(to);
    return Object.fromEntries(
      Object.keys(draft).map((cell) => {
        const [r, c] = address(cell);
        return [cell, m.getCellContent(0, r, c)];
      }),
    );
  } finally {
    m.free();
  }
}
function calculateCells(seed: Cells, draft: Cells): Cells {
  const model = baseModel(seed);
  try {
    write(model, draft);
    model.resumeEvaluation();
    model.evaluate();
    // Financial functions apply currency styles automatically. Read full numeric
    // precision instead of comparing rounded, formatted currency strings.
    model.updateRangeStyle(
      { sheet: 0, row: 1, column: 1, width: 26, height: 99 },
      'num_fmt',
      '0.###############',
    );
    return Object.fromEntries(
      [...new Set([...Object.keys(seed), ...Object.keys(draft)])].map((cell) => {
        const [r, c] = address(cell);
        return [cell, model.getFormattedCellValue(0, r, c)];
      }),
    );
  } finally {
    model.free();
  }
}
export function calculateView(
  challenge: ChallengeDefinition,
  draft: Cells,
  language: Language,
): EngineView {
  const canonical = canonicalDraft(challenge, draft, language);
  const reference = Object.fromEntries(challenge.targets.map((t) => [t.cell, t.formula]));
  return {
    values: calculateCells(challenge.seed, canonical),
    formulas: translateDraft(challenge, canonical, 'en', language),
    solutions: translateDraft(challenge, reference, 'en', language),
  };
}
function matches(actual: string | undefined, expected: string | undefined, tolerance: number) {
  if (
    actual === undefined ||
    expected === undefined ||
    actual.startsWith('#') ||
    expected.startsWith('#')
  )
    return false;
  if (
    actual !== '' &&
    expected !== '' &&
    Number.isFinite(Number(actual)) &&
    Number.isFinite(Number(expected))
  )
    return Math.abs(Number(actual) - Number(expected)) <= tolerance;
  return actual === expected;
}
export function evaluateChallenge(
  challenge: ChallengeDefinition,
  draft: Cells,
  language: Language,
  interpretation?: number,
): EvaluationResult {
  const canonical = canonicalDraft(challenge, draft, language);
  const reference = Object.fromEntries(challenge.targets.map((t) => [t.cell, t.formula]));
  const actual = calculateCells(challenge.seed, canonical);
  const expected = calculateCells(challenge.seed, reference);
  const checks: EvaluationResult['checks'] = challenge.targets.map((t) => ({
    cell: t.cell,
    passed: false,
    reason: !canonical[t.cell]?.startsWith('=')
      ? 'formula'
      : actual[t.cell]?.startsWith('#')
        ? 'error'
        : !matches(actual[t.cell], expected[t.cell], t.tolerance)
          ? 'value'
          : 'correct',
  }));
  checks.forEach((check, i) => {
    const required = challenge.targets[i].absoluteRefs;
    if (check.reason === 'correct' && required?.length) {
      const refs = getTokens(canonical[check.cell]).flatMap(({ token }) =>
        typeof token === 'object' && 'Reference' in token ? [token.Reference] : [],
      );
      if (
        !required.every((cell) => {
          const [row, column] = address(cell);
          return refs.some(
            (ref) =>
              ref.row === row && ref.column === column && ref.absolute_row && ref.absolute_column,
          );
        })
      )
        check.reason = 'reference';
    }
  });
  for (const variants of challenge.variants) {
    const seed = { ...challenge.seed, ...variants };
    const changedActual = calculateCells(seed, canonical),
      changedExpected = calculateCells(seed, reference);
    checks.forEach((check, i) => {
      if (
        check.reason === 'correct' &&
        !matches(
          changedActual[check.cell],
          changedExpected[check.cell],
          challenge.targets[i].tolerance,
        )
      )
        check.reason = 'variant';
    });
  }
  checks.forEach((c) => {
    c.passed = c.reason === 'correct';
  });
  const interpretationPassed =
    !challenge.interpretation || interpretation === challenge.interpretation.answer;
  return {
    passed: checks.every((c) => c.passed) && interpretationPassed,
    checks,
    interpretationPassed,
  };
}
