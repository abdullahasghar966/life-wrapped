'use client';
import { useEffect, useState } from 'react';
import { getEngine } from '@/engine/client';
import type { InsightResult } from '@/engine/insights/types';
import type { DeckId } from '@/engine/types';

const DECKS: DeckId[] = ['spotify', 'youtube', 'netflix', 'life'];

export function DebugClient() {
  const [answer, setAnswer] = useState<string>('…');
  const [decks, setDecks] = useState<Partial<Record<DeckId, InsightResult[]>> | null>(null);
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    getEngine()
      .ping()
      .then((n) => setAnswer(String(n)))
      .catch((e: unknown) => setAnswer(`error: ${String(e)}`));
  }, []);

  async function loadSample() {
    const engine = getEngine();
    const t0 = performance.now();
    await engine.loadSample(undefined, {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const out: Partial<Record<DeckId, InsightResult[]>> = {};
    for (const d of DECKS) out[d] = await engine.getDeck(d);
    setMs(Math.round(performance.now() - t0));
    setDecks(out);
  }

  return (
    <>
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">DuckDB</h2>
        <p className="mt-2 font-mono">
          SELECT 42 → <output data-testid="duckdb-answer">{answer}</output>
        </p>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Sample insights</h2>
        <button
          type="button"
          onClick={loadSample}
          className="bg-primary text-primary-foreground mt-3 rounded-full px-5 py-2 font-semibold"
        >
          Load sample and run every deck
        </button>
        {ms !== null && (
          <p className="text-muted-foreground mt-2 text-sm" data-testid="debug-timing">
            Generated, ingested and computed in {ms} ms
          </p>
        )}
        {decks &&
          DECKS.map((d) => (
            <details key={d} className="bg-card mt-4 rounded-2xl border p-4" open={d === 'spotify'}>
              <summary className="cursor-pointer font-semibold" data-testid={`debug-deck-${d}`}>
                {d}: {decks[d]?.length ?? 0} cards
              </summary>
              <pre className="mt-3 max-h-[60vh] overflow-auto text-xs leading-relaxed">
                {JSON.stringify(decks[d], null, 2)}
              </pre>
            </details>
          ))}
      </section>
    </>
  );
}
