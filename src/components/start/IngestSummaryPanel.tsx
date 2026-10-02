'use client';
import { AlertTriangle, CheckCircle2, Copy, Info, MinusCircle, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DeckTile } from '@/components/DeckTile';
import { Button } from '@/components/ui/button';
import type { FileReport, IngestSummary } from '@/engine/types';
import { engine } from '@/lib/engineStore';
import { fmtDate, fmtInt, fmt1 } from '@/lib/format';
import { DECK_ORDER } from '@/story/decks';

const STATUS_ICON: Record<FileReport['status'], React.ReactNode> = {
  ok: <CheckCircle2 aria-label="Recognised" className="text-aurora-lime size-4 shrink-0" />,
  duplicate: <Copy aria-label="Duplicate" className="text-muted-foreground size-4 shrink-0" />,
  unsupported: <Info aria-label="Not used" className="text-muted-foreground size-4 shrink-0" />,
  empty: <MinusCircle aria-label="Empty" className="text-muted-foreground size-4 shrink-0" />,
  error: <AlertTriangle aria-label="Error" className="text-destructive size-4 shrink-0" />,
};

function Range({ r }: { r?: { first: string; last: string } }) {
  if (!r) return null;
  return (
    <span className="text-muted-foreground">
      {' '}
      · {fmtDate(r.first)} – {fmtDate(r.last)}
    </span>
  );
}

export function IngestSummaryPanel({ summary }: { summary: IngestSummary }) {
  const c = summary.counts;
  const decks = DECK_ORDER.filter((d) => summary.availableDecks.includes(d));
  const nothing = c.spotifyPlays + c.youtubeWatches + c.youtubeSearches + c.netflixViews === 0;
  const q = summary.isSample ? '?sample=1' : '';

  return (
    <section aria-labelledby="summary-title" className="bg-card/60 rounded-3xl border p-6 sm:p-8">
      {summary.isSample && (
        <p className="bg-aurora-violet/15 mb-5 rounded-full px-4 py-2 text-sm">
          You&apos;re viewing sample data for Alex. Drop your own files above to replace it.
        </p>
      )}
      <h2 id="summary-title" className="font-display text-2xl font-bold">
        {nothing ? 'Nothing we can use yet' : 'Here’s what we found'}
      </h2>

      {!nothing && (
        <ul className="mt-4 space-y-2 text-sm" data-testid="platform-summary">
          {c.spotifyPlays > 0 && (
            <li>
              <strong>Spotify:</strong> {fmtInt(c.spotifyMusic)} music plays
              {c.spotifyPodcast > 0 && <>, {fmtInt(c.spotifyPodcast)} podcast plays</>}
              <Range r={summary.ranges.spotify} />
            </li>
          )}
          {c.youtubeWatches + c.youtubeSearches > 0 && (
            <li>
              <strong>YouTube:</strong> {fmtInt(c.youtubeWatches)} watches
              {c.youtubeSearches > 0 && <>, {fmtInt(c.youtubeSearches)} searches</>}
              <Range r={summary.ranges.youtube} />
            </li>
          )}
          {c.netflixViews > 0 && (
            <li>
              <strong>Netflix:</strong> {fmtInt(c.netflixViews)} views across{' '}
              {summary.netflixProfiles.length === 1
                ? '1 profile'
                : `${summary.netflixProfiles.length} profiles`}
              <Range r={summary.ranges.netflix} />
            </li>
          )}
        </ul>
      )}

      {summary.youtubeHtmlFound && (
        <div
          role="status"
          className="border-aurora-cyan/40 bg-aurora-cyan/10 mt-5 rounded-2xl border p-4 text-sm"
        >
          <p className="font-semibold">Your YouTube history is in HTML</p>
          <p className="text-muted-foreground mt-1">
            Google Takeout exports history as HTML by default, and we can only read the JSON
            version. In Takeout, open <strong>Multiple formats</strong>, set{' '}
            <strong>History</strong> to <strong>JSON</strong>, export again and drop the new zip
            here.
          </p>
        </div>
      )}

      {summary.files.length > 0 && (
        <details className="mt-5 text-sm" open={nothing || summary.files.length <= 6}>
          <summary className="text-muted-foreground cursor-pointer select-none">
            {summary.files.length === 1 ? '1 file' : `${summary.files.length} files`} checked
          </summary>
          <ul className="mt-3 space-y-2" data-testid="file-reports">
            {summary.files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex gap-2">
                {STATUS_ICON[f.status]}
                <span className="min-w-0">
                  <span className="block truncate font-medium">{f.name}</span>
                  <span className="text-muted-foreground">{f.message}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {summary.netflixProfiles.length > 1 && (
        <fieldset className="mt-6">
          <legend className="font-semibold">Which Netflix profile is you?</legend>
          <p className="text-muted-foreground mt-1 text-sm">
            Netflix exports every profile on the account. We only ever look at the one you pick,
            because other people&apos;s viewing isn&apos;t yours to analyse or share.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.netflixProfiles.map((p) => {
              const checked = summary.options.netflixProfile === p.name;
              return (
                <label
                  key={p.name}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-(--ring) ${
                    checked ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="netflix-profile"
                    value={p.name}
                    checked={checked}
                    onChange={() => engine.setOptions({ netflixProfile: p.name })}
                    className="accent-(--primary)"
                  />
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{fmt1(p.hours)} h</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {decks.length > 0 ? (
        <div className="mt-8">
          <h3 className="font-display text-lg font-bold">Your stories</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="deck-tiles">
            {decks.map((d) => (
              <DeckTile key={d} deck={d} href={`/story/${d}${q}`} sample={summary.isSample} />
            ))}
          </div>
          {!decks.includes('life') && (
            <p className="text-muted-foreground mt-4 text-sm">
              Add another platform to unlock your online life story.
            </p>
          )}
        </div>
      ) : (
        !nothing && (
          <p className="text-muted-foreground mt-6 text-sm">
            There isn&apos;t enough here for a story yet. A deck needs about an hour of music, 50
            YouTube videos or 5 hours of Netflix in the last 12 months.
          </p>
        )
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {decks[0] && (
          <Button asChild size="lg" className="rounded-full px-6">
            <Link href={`/story/${decks[0]}${q}`}>
              <Play /> Play my story
            </Link>
          </Button>
        )}
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full px-5"
          onClick={() => engine.clear()}
        >
          <Trash2 /> Clear my data
        </Button>
      </div>
    </section>
  );
}
