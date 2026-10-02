import { afterAll, beforeAll, expect, it } from 'vitest';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';

/**
 * The production CSP has no 'unsafe-eval'. Any library that compiles code with
 * `new Function` would fail in the browser, so this test makes it fail here too.
 */
let t: TestEngine;
beforeAll(async () => {
  t = await createTestEngine();
  await t.engine.ping();
});
afterAll(() => t.db.close());

it('ingests and loads the sample without evaluating strings as code', async () => {
  const original = globalThis.Function;
  const attempts: string[] = [];
  globalThis.Function = new Proxy(original, {
    construct(_target, args) {
      attempts.push(String(args.at(-1)).slice(0, 80));
      throw new EvalError('Blocked: the CSP has no unsafe-eval');
    },
    apply(_target, _this, args) {
      attempts.push(String(args.at(-1)).slice(0, 80));
      throw new EvalError('Blocked: the CSP has no unsafe-eval');
    },
  });
  try {
    await t.engine.loadSample(undefined, { timeZone: TEST_TZ });
  } finally {
    globalThis.Function = original;
  }
  expect(attempts).toEqual([]);
});
