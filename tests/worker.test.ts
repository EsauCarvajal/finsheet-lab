import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkerEngine } from '../src/engine/client';
import { challenges } from '../src/content/catalog';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    FakeWorker.instances.push(this);
  }
  reply(data: unknown) {
    this.onmessage?.({ data });
  }
}

describe('spreadsheet worker recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it('terminates timed-out calculations and calculates again in a fresh worker', async () => {
    const engine = new WorkerEngine();
    const pending = engine.calculate(challenges[0], {}, 'es');
    const rejected = expect(pending).rejects.toThrow('ENGINE_TIMEOUT');
    await vi.advanceTimersByTimeAsync(10000);
    await rejected;
    expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
    const recovered = engine.calculate(challenges[0], { B7: '=SUMA(B2:B5)' }, 'es');
    const worker = FakeWorker.instances[1];
    const request = worker.postMessage.mock.calls[0][0];
    worker.reply({
      id: request.id,
      result: { values: { B7: '60000' }, formulas: {}, solutions: {} },
    });
    await expect(recovered).resolves.toMatchObject({ values: { B7: '60000' } });
    expect(vi.getTimerCount()).toBe(0);
    engine.dispose();
  });
  it('matches responses to requests even when they arrive out of order', async () => {
    const engine = new WorkerEngine();
    const first = engine.calculate(challenges[0], {}, 'es');
    const second = engine.translate(challenges[0], { B7: '=SUMA(B2:B5)' }, 'es', 'en');
    const worker = FakeWorker.instances[0];
    const [a, b] = worker.postMessage.mock.calls.map((call) => call[0]);
    worker.reply({ id: b.id, result: { B7: '=SUM(B2:B5)' } });
    worker.reply({ id: a.id, result: { values: {}, formulas: {}, solutions: {} } });
    await expect(second).resolves.toEqual({ B7: '=SUM(B2:B5)' });
    await expect(first).resolves.toMatchObject({ values: {} });
    expect(vi.getTimerCount()).toBe(0);
    engine.dispose();
  });
  it('recovers from a worker error and rejects outstanding work on disposal', async () => {
    const engine = new WorkerEngine();
    const first = engine.calculate(challenges[0], {}, 'en');
    const failed = expect(first).rejects.toThrow('ENGINE_UNAVAILABLE');
    FakeWorker.instances[0].onerror?.();
    await failed;
    const next = engine.evaluate(challenges[0], {}, 'en');
    const closed = expect(next).rejects.toThrow('ENGINE_CLOSED');
    engine.dispose();
    await closed;
    expect(FakeWorker.instances).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
