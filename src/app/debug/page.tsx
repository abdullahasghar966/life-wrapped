import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { DebugClient } from './DebugClient';

export const metadata: Metadata = {
  title: 'Engine debug',
  robots: { index: false, follow: false },
};

/**
 * Developer page: proves the worker + DuckDB run, and dumps every sample insight
 * as JSON. Only in development, or when ENABLE_DEBUG_PAGE=1 (the E2E server).
 */
export default async function DebugPage() {
  await connection();
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_PAGE !== '1') notFound();
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold">Engine debug</h1>
      <p className="text-muted-foreground mt-2">
        Runs entirely in this tab, against the seeded sample data.
      </p>
      <DebugClient />
    </main>
  );
}
