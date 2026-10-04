'use client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IngestProgress as Progress } from '@/engine/types';

const STAGE: Record<Progress['stage'], string> = {
  reading: 'Opening files',
  parsing: 'Reading your history',
  loading: 'Building your tables',
  done: 'Done',
};

export function IngestProgress({
  progress,
  onCancel,
}: {
  progress: Progress | null;
  onCancel?: () => void;
}) {
  const pct = Math.round((progress?.fraction ?? 0) * 100);
  return (
    <section aria-label="Reading your files" className="bg-paper-2 border-ink border-[1.5px] p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Loader2 aria-hidden className="text-red-ink size-5 animate-spin" />
          <div>
            <p className="font-semibold">{progress ? STAGE[progress.stage] : 'Starting…'}</p>
            {progress?.file && (
              <p className="text-muted-foreground max-w-[60ch] truncate text-sm">{progress.file}</p>
            )}
          </div>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Overall progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="bg-paper-3 mt-5 h-2 overflow-hidden"
      >
        <div
          className="bg-ink h-full origin-left transition-transform duration-300"
          style={{ transform: `scaleX(${Math.max(0.02, pct / 100)})` }}
        />
      </div>
    </section>
  );
}
