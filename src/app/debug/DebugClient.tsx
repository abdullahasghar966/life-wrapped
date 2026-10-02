'use client';
import { useEffect, useState } from 'react';
import { getEngine } from '@/engine/client';

export function DebugClient() {
  const [answer, setAnswer] = useState<string>('…');

  useEffect(() => {
    getEngine()
      .ping()
      .then((n) => setAnswer(String(n)))
      .catch((e: unknown) => setAnswer(`error: ${String(e)}`));
  }, []);

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold">DuckDB</h2>
      <p className="mt-2 font-mono">
        SELECT 42 → <output data-testid="duckdb-answer">{answer}</output>
      </p>
    </section>
  );
}
