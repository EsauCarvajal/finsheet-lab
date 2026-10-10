import type {
  Cells,
  ChallengeDefinition,
  EngineView,
  EvaluationResult,
  Language,
  SpreadsheetEngine,
} from '../types';

export class WorkerEngine implements SpreadsheetEngine {
  private worker: Worker | null = null;
  private sequence = 0;
  private pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private getWorker() {
    if (!this.worker) {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = ({ data }) => {
        const entry = this.pending.get(data.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        this.pending.delete(data.id);
        data.error ? entry.reject(new Error(data.error)) : entry.resolve(data.result);
      };
      this.worker.onerror = () => this.abort('ENGINE_UNAVAILABLE');
    }
    return this.worker;
  }
  private abort(message: string) {
    this.worker?.terminate();
    this.worker = null;
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error(message));
    }
    this.pending.clear();
  }
  private call<T>(
    operation: string,
    challenge: ChallengeDefinition,
    draft: Cells,
    language: Language,
    extra: object = {},
  ): Promise<T> {
    const worker = this.getWorker(),
      id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.abort('ENGINE_TIMEOUT'), 10000);
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
      worker.postMessage({ id, operation, challenge, draft, language, ...extra });
    });
  }
  calculate(c: ChallengeDefinition, d: Cells, l: Language) {
    return this.call<EngineView>('calculate', c, d, l);
  }
  translate(c: ChallengeDefinition, d: Cells, from: Language, to: Language) {
    return this.call<Cells>('translate', c, d, from, { to });
  }
  evaluate(c: ChallengeDefinition, d: Cells, l: Language, interpretation?: number) {
    return this.call<EvaluationResult>('evaluate', c, d, l, { interpretation });
  }
  dispose() {
    this.abort('ENGINE_CLOSED');
  }
}
