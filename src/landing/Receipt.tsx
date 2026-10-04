import type { LifeSummary } from '@/engine/insights/life/summary';
import type { NetflixSummary } from '@/engine/insights/netflix/summary';
import type { SpotifySummary } from '@/engine/insights/spotify/summary';
import type { YoutubeSummary } from '@/engine/insights/youtube/summary';
import { Barcode, Dashed, LeaderRow, TornEdge } from '@/components/brand';
import { cn } from '@/lib/utils';
import data from './preview.json';

const nf = new Intl.NumberFormat('en-US');
const spotify = data.spotify as SpotifySummary;
const youtube = data.youtube as YoutubeSummary;
const netflix = data.netflix as NetflixSummary;
const life = data.life as LifeSummary;

/** The landing page's printed "receipt" of a year, with the seeded sample's real numbers. */
export function Receipt({ className }: { className?: string }) {
  return (
    <figure
      aria-label="A sample receipt of one year online"
      className={cn(
        'text-ink w-[17rem] shrink-0 font-mono text-[13px] leading-relaxed drop-shadow-[0_18px_22px_rgb(22_19_15/0.18)]',
        className,
      )}
    >
      <div className="bg-paper-2 px-5 pt-5 pb-3">
        <p className="text-center font-medium tracking-[0.14em] uppercase">Your year, itemised</p>
        <p className="text-ink-2 text-center text-[11px] tracking-[0.08em] uppercase">
          Sample data · nobody real
        </p>
        <Dashed className="mt-3 mb-2" />
        <LeaderRow label="Minutes" value={nf.format(spotify.minutes)} />
        <LeaderRow label="Videos" value={nf.format(youtube.videos)} />
        <LeaderRow label="Show hours" value={nf.format(netflix.hours)} />
        <LeaderRow label="Artist" value={spotify.topArtist} />
        <Dashed />
        <LeaderRow
          strong
          label="Total"
          value={`${life.estimated ? '≈ ' : ''}${nf.format(life.hours)} h`}
        />
        <p className="mt-3 uppercase">You are:</p>
        <p className="font-medium uppercase">{life.label}</p>
        <Barcode text={life.label} className="mt-4 h-9 justify-center" />
        <p className="mt-2 text-center text-[11px] tracking-[0.12em] uppercase">
          Nothing sent · thank you
        </p>
        {life.estimated && (
          <p className="text-ink-2 mt-2 text-[11px] leading-snug">
            ≈ YouTube time is estimated from the gaps between videos.
          </p>
        )}
      </div>
      <TornEdge className="text-paper-2 h-2.5" />
    </figure>
  );
}
