export type Language = 'es' | 'en';
export type Localized = Record<Language, string>;
export type Cells = Record<string, string>;
export type Difficulty = 'easy' | 'medium' | 'hard' | 'case';
export interface Target {
  cell: string;
  formula: string;
  label: Localized;
  tolerance: number;
  format?: 'money' | 'percent' | 'date' | 'number';
  absoluteRefs?: string[];
}
export interface ChallengeDefinition {
  id: string;
  version: number;
  module: string;
  difficulty: Difficulty;
  title: Localized;
  lesson: Localized;
  task: Localized;
  hints: [Localized, Localized];
  explanation: Localized;
  seed: Cells;
  targets: Target[];
  variants: Cells[];
  prerequisiteIds: string[];
  minutes: number;
  interpretation?: {
    question: Localized;
    options: Localized[];
    answer: number;
    explanation: Localized;
  };
}
export interface ModuleDefinition {
  id: string;
  title: Localized;
  description: Localized;
  icon: string;
  color: string;
  functions: string[];
}
export interface ActivityProgress {
  version: number;
  draft: Cells;
  formulaLanguage: Language;
  attempts: number;
  hints: number;
  solutionViewed: boolean;
  completed: boolean;
  assisted: boolean;
  completedAt?: string;
  interpretation?: number;
  updatedAt: string;
}
export interface ProgressState {
  version: 1;
  activities: Record<string, ActivityProgress>;
  settings: { language: Language; formulaLanguage: Language };
}
export interface EvaluationResult {
  passed: boolean;
  checks: {
    cell: string;
    passed: boolean;
    reason: 'correct' | 'formula' | 'error' | 'value' | 'variant' | 'reference';
  }[];
  interpretationPassed: boolean;
}
export interface EngineView {
  values: Cells;
  formulas: Cells;
  solutions: Cells;
}
export interface SpreadsheetEngine {
  calculate(challenge: ChallengeDefinition, draft: Cells, language: Language): Promise<EngineView>;
  translate(
    challenge: ChallengeDefinition,
    draft: Cells,
    from: Language,
    to: Language,
  ): Promise<Cells>;
  evaluate(
    challenge: ChallengeDefinition,
    draft: Cells,
    language: Language,
    interpretation?: number,
  ): Promise<EvaluationResult>;
  dispose(): void;
}
export interface ProgressRepository {
  load(): Promise<ProgressState>;
  save(state: ProgressState): Promise<void>;
  clear(): Promise<void>;
}
export const bi = (es: string, en: string): Localized => ({ es, en });
export const pointsFor = (difficulty: Difficulty) =>
  ({ easy: 10, medium: 20, hard: 30, case: 100 })[difficulty];
