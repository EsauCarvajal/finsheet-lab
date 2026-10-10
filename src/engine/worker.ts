import init from '@ironcalc/wasm';
import wasmUrl from '@ironcalc/wasm/wasm_bg.wasm?url';
import { calculateView, evaluateChallenge, translateDraft } from './core';
import type { Cells, ChallengeDefinition, Language } from '../types';

const ready = init({ module_or_path: wasmUrl });
type Request = {
  id: number;
  operation: 'calculate' | 'translate' | 'evaluate';
  challenge: ChallengeDefinition;
  draft: Cells;
  language: Language;
  to?: Language;
  interpretation?: number;
};
self.onmessage = async ({ data }: { data: Request }) => {
  try {
    await ready;
    const { id, operation, challenge, draft, language, to, interpretation } = data;
    const result =
      operation === 'calculate'
        ? calculateView(challenge, draft, language)
        : operation === 'translate'
          ? translateDraft(challenge, draft, language, to!)
          : evaluateChallenge(challenge, draft, language, interpretation);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      id: data.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
