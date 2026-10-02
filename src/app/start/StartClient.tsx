'use client';
import { Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { DropZone } from '@/components/start/DropZone';
import { IngestProgress } from '@/components/start/IngestProgress';
import { IngestSummaryPanel } from '@/components/start/IngestSummaryPanel';
import { Button } from '@/components/ui/button';
import { engine, useEngineState } from '@/lib/engineStore';

export function StartClient() {
  const { status, summary, progress, error } = useEngineState();
  const params = useSearchParams();
  const reloaded = params.get('reason') === 'reload';

  useEffect(() => {
    void engine.restore();
  }, []);

  const busy = status === 'ingesting' || status === 'loading-sample';

  return (
    <div className="space-y-6">
      {reloaded && !summary && (
        <p role="status" className="bg-aurora-violet/15 rounded-2xl px-4 py-3 text-sm">
          Your data was cleared when the page reloaded. That&apos;s by design: nothing is saved
          anywhere. Drop your files again to pick up where you left off.
        </p>
      )}

      <DropZone onFiles={(files) => void engine.ingest(files)} disabled={busy} />

      {!summary && !busy && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-muted-foreground text-sm">No exports handy?</p>
          <Button
            variant="secondary"
            size="lg"
            className="rounded-full px-5"
            onClick={() => void engine.loadSample()}
          >
            <Sparkles /> Try with sample data
          </Button>
        </div>
      )}

      {status === 'ingesting' && (
        <IngestProgress progress={progress} onCancel={() => void engine.cancel()} />
      )}
      {status === 'loading-sample' && (
        <IngestProgress
          progress={{
            stage: 'parsing',
            filesDone: 0,
            filesTotal: 4,
            fraction: 0.5,
            file: 'Generating a year of sample data for Alex',
          }}
        />
      )}

      {error && (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 rounded-2xl border px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      {summary && !busy && <IngestSummaryPanel summary={summary} />}
    </div>
  );
}
