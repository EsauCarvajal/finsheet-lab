import { openDB, type IDBPDatabase } from 'idb';
import { z } from 'zod';
import { challenges } from '../content/catalog';
import { pointsFor, type ProgressRepository, type ProgressState } from '../types';

const activitySchema = z
  .object({
    version: z.number().int().positive(),
    draft: z.record(z.string().regex(/^[A-Z][1-9]\d?$/), z.string().max(512)),
    formulaLanguage: z.enum(['es', 'en']),
    attempts: z.number().int().min(0).max(1000000),
    hints: z.number().int().min(0).max(2),
    solutionViewed: z.boolean(),
    completed: z.boolean(),
    assisted: z.boolean(),
    completedAt: z.iso.datetime().optional(),
    interpretation: z.number().int().min(0).max(2).optional(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const progressSchema = z
  .object({
    version: z.literal(1),
    activities: z.record(z.string().max(100), activitySchema),
    settings: z
      .object({ language: z.enum(['es', 'en']), formulaLanguage: z.enum(['es', 'en']) })
      .strict(),
  })
  .strict();
export const emptyProgress = (): ProgressState => ({
  version: 1,
  activities: {},
  settings: { language: 'es', formulaLanguage: 'es' },
});
export function validateProgress(input: unknown): ProgressState {
  const value = progressSchema.parse(input);
  if (Object.keys(value.activities).length > 1000) throw new Error('INVALID_BACKUP');
  for (const [id, p] of Object.entries(value.activities)) {
    const c = challenges.find((c) => c.id === id);
    if (!c) throw new Error('UNKNOWN_CHALLENGE');
    if (p.version !== c.version) throw new Error('CONTENT_VERSION');
    if (Object.keys(p.draft).some((cell) => !c.targets.some((t) => t.cell === cell)))
      throw new Error('INVALID_DRAFT');
  }
  return value;
}
export function parseBackup(text: string): ProgressState {
  if (new TextEncoder().encode(text).byteLength > 1024 * 1024) throw new Error('BACKUP_SIZE');
  return validateProgress(JSON.parse(text));
}
export class BrowserProgressRepository implements ProgressRepository {
  private db: Promise<IDBPDatabase> | undefined;
  private connection() {
    return (this.db ??= openDB('finsheet-lab', 1, {
      upgrade(db) {
        db.createObjectStore('state');
      },
    }));
  }
  async load() {
    const db = await this.connection();
    const data = await db.get('state', 'progress');
    return data ? validateProgress(data) : emptyProgress();
  }
  async save(state: ProgressState) {
    const data = validateProgress(state);
    await (await this.connection()).put('state', data, 'progress');
  }
  async clear() {
    await (await this.connection()).delete('state', 'progress');
  }
}
export function progressStats(state: ProgressState) {
  const done = challenges.filter((c) => state.activities[c.id]?.completed);
  return {
    completed: done.length,
    points: done.reduce((sum, c) => sum + pointsFor(c.difficulty), 0),
    percent: Math.round((done.length / challenges.length) * 100),
  };
}
export function nextChallenge(state: ProgressState) {
  return (
    challenges.find(
      (c) =>
        !state.activities[c.id]?.completed &&
        c.prerequisiteIds.every((id) => state.activities[id]?.completed),
    ) ??
    challenges.find((c) => !state.activities[c.id]?.completed) ??
    challenges[0]
  );
}
