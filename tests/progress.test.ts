import { describe, expect, it } from 'vitest';
import { emptyProgress, nextChallenge, parseBackup, progressStats } from '../src/storage/progress';

describe('portable progress', () => {
  it('round trips a backup and awards points only once', () => {
    const state = emptyProgress();
    state.activities['foundation-01'] = {
      version: 1,
      draft: { B7: '=SUMA(B2:B5)' },
      formulaLanguage: 'es',
      attempts: 3,
      hints: 2,
      solutionViewed: false,
      completed: true,
      assisted: false,
      updatedAt: new Date().toISOString(),
    };
    expect(parseBackup(JSON.stringify(state))).toEqual(state);
    expect(progressStats(state)).toMatchObject({ completed: 1, points: 10 });
    expect(progressStats(state).points).toBe(10);
    expect(nextChallenge(state).id).toBe('foundation-02');
  });
  it('rejects invalid, oversized, unexpected and incompatible data', () => {
    expect(() => parseBackup('{')).toThrow();
    expect(() => parseBackup('x'.repeat(1024 * 1024 + 1))).toThrow('BACKUP_SIZE');
    expect(() => parseBackup(JSON.stringify({ ...emptyProgress(), version: 2 }))).toThrow();
    const state = emptyProgress();
    state.activities['foundation-01'] = {
      version: 1,
      draft: { A1: 'injected' },
      formulaLanguage: 'en',
      attempts: 0,
      hints: 0,
      solutionViewed: false,
      completed: false,
      assisted: false,
      updatedAt: new Date().toISOString(),
    };
    expect(() => parseBackup(JSON.stringify(state))).toThrow('INVALID_DRAFT');
  });
});
