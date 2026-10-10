import { z } from 'zod';
import type { ChallengeDefinition, ModuleDefinition } from '../types.ts';
const localized = z.object({ es: z.string().min(1), en: z.string().min(1) }).strict();
const cell = z.string().regex(/^[A-Z][1-9]\d?$/);
const cells = z.record(cell, z.string().max(512));
const target = z
  .object({
    cell,
    formula: z.string().startsWith('=').max(512),
    label: localized,
    tolerance: z.number().nonnegative(),
    format: z.enum(['money', 'percent', 'date', 'number']).optional(),
    absoluteRefs: z.array(cell).optional(),
  })
  .strict();
const schema = z
  .object({
    id: z.string().min(1),
    version: z.number().int().positive(),
    module: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'case']),
    title: localized,
    lesson: localized,
    task: localized,
    hints: z.tuple([localized, localized]),
    explanation: localized,
    seed: cells,
    targets: z.array(target).min(1),
    variants: z.array(cells).min(2),
    prerequisiteIds: z.array(z.string()),
    minutes: z.number().positive(),
    interpretation: z
      .object({
        question: localized,
        options: z.array(localized).length(3),
        answer: z.number().int().min(0).max(2),
        explanation: localized,
      })
      .strict()
      .optional(),
  })
  .strict();
export function validateCatalog(challenges: ChallengeDefinition[], modules: ModuleDefinition[]) {
  z.array(schema).parse(challenges);
  const ids = new Set(challenges.map((c) => c.id));
  if (ids.size !== challenges.length) throw new Error('Duplicate challenge ID');
  for (const c of challenges) {
    if (c.module !== 'cases' && !modules.some((m) => m.id === c.module))
      throw new Error(`Unknown module: ${c.id}`);
    if (c.prerequisiteIds.some((id) => !ids.has(id) || id === c.id))
      throw new Error(`Invalid prerequisites: ${c.id}`);
    if (new Set(c.targets.map((t) => t.cell)).size !== c.targets.length)
      throw new Error(`Duplicate target: ${c.id}`);
    if (c.targets.some((t) => c.seed[t.cell] !== undefined))
      throw new Error(`Target overwrites a protected seed cell: ${c.id}`);
    if (
      c.variants.some((v) => Object.keys(v).some((cell) => c.targets.some((t) => t.cell === cell)))
    )
      throw new Error(`Variant overwrites an answer: ${c.id}`);
    if (c.difficulty === 'case' && !c.interpretation)
      throw new Error(`Case lacks interpretation: ${c.id}`);
  }
}
