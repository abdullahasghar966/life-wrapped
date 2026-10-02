import { ARCHETYPE_THRESHOLDS as T, NIGHT_END_HOUR } from '../constants';
import { pct } from '../copy';
import { define, one, round3 } from '../helpers';
import { bingeRecord } from '../netflix/shared';
import { distinctArtists } from '../spotify/topArtist';
import { spotifyPlays } from '../filters';
import type { DataCtx, QueryFn } from '../types';
import { distinctChannels, longestSession } from '../youtube/shared';
import { secondsByPlatform, sum } from './shared';

export type ArchetypeId =
  'nightOwl' | 'bingeMaster' | 'rabbitHoleDiver' | 'explorer' | 'loyalist' | 'soundtrackLife';

export const ARCHETYPE_LABEL: Record<ArchetypeId, string> = {
  nightOwl: 'The Night Owl',
  bingeMaster: 'The Binge Master',
  rabbitHoleDiver: 'The Rabbit-Hole Diver',
  explorer: 'The Explorer',
  loyalist: 'The Loyalist',
  soundtrackLife: 'The Soundtrack Life',
};

export interface ArchetypeScore {
  id: ArchetypeId;
  /** The measured value (share, count or hours). */
  metric: number;
  threshold: number;
  /** metric ÷ threshold; ≥ 1 means the archetype's bar was met. */
  score: number;
  /** Plain-language "why", e.g. "41% of your time after midnight". */
  reason: string;
}

export interface LifePersonality {
  archetype: ArchetypeId;
  label: string;
  /** The three highest scores, which decided it. */
  why: ArchetypeScore[];
}

/** Scores every archetype (§9.4): metric ÷ threshold, highest wins, ties by list order. */
export async function scoreArchetypes(q: QueryFn, ctx: DataCtx): Promise<ArchetypeScore[]> {
  const has = (p: 'spotify' | 'youtube' | 'netflix') => ctx.availablePlatforms.includes(p);
  const all = await secondsByPlatform(q, ctx);
  const night = await secondsByPlatform(q, ctx, `AND local_hour < ${NIGHT_END_HOUR}`);
  const total = Math.max(1, sum(all));
  const scores: ArchetypeScore[] = [];
  const push = (id: ArchetypeId, metric: number, threshold: number, reason: string) =>
    scores.push({
      id,
      metric: round3(metric),
      threshold,
      score: round3(metric / threshold),
      reason,
    });

  const nightShare = sum(night) / total;
  push(
    'nightOwl',
    nightShare,
    T.nightOwlShare,
    `${pct(nightShare)} of your time was after midnight`,
  );

  const binge = has('netflix') ? await bingeRecord(q, ctx) : null;
  push(
    'bingeMaster',
    binge?.count ?? 0,
    T.bingeEpisodes,
    binge ? `${binge.count} episodes of ${binge.series} in one day` : 'no Netflix binges',
  );

  const hole = has('youtube') ? await longestSession(q, ctx) : null;
  const holeHours = (hole?.minutes ?? 0) / 60;
  push(
    'rabbitHoleDiver',
    holeHours,
    T.rabbitHoleHours,
    hole ? `a ${Math.round(holeHours * 10) / 10}-hour YouTube session` : 'no YouTube sessions',
  );

  const artists = has('spotify') ? await distinctArtists(q, ctx) : 0;
  const channels = has('youtube') ? await distinctChannels(q, ctx) : 0;
  const explorerArtists = artists / T.explorerArtists;
  const explorerChannels = channels / T.explorerChannels;
  scores.push({
    id: 'explorer',
    metric: explorerArtists >= explorerChannels ? artists : channels,
    threshold: explorerArtists >= explorerChannels ? T.explorerArtists : T.explorerChannels,
    score: round3(Math.max(explorerArtists, explorerChannels)),
    reason:
      explorerArtists >= explorerChannels
        ? `${artists} different artists`
        : `${channels} different YouTube channels`,
  });

  let loyal = 0;
  if (has('spotify')) {
    const [w, p] = spotifyPlays(ctx);
    const r = await one<{ share: number }>(
      q,
      `SELECT (MAX(ms) / SUM(ms))::DOUBLE AS share FROM (
         SELECT SUM(ms_played) AS ms FROM spotify_plays WHERE ${w} AND artist IS NOT NULL GROUP BY artist)`,
      p,
    );
    loyal = r?.share ?? 0;
  }
  push('loyalist', loyal, T.loyalistShare, `your top artist was ${pct(loyal)} of your music`);

  const spotifyShare = all.spotify / total;
  push(
    'soundtrackLife',
    spotifyShare,
    T.soundtrackShare,
    `${pct(spotifyShare)} of your time was music`,
  );
  return scores;
}

export default define<LifePersonality>({
  id: 'life.personality',
  deck: 'life',
  order: 7,
  title: 'Media personality',
  requires: () => true,
  async run(q, ctx) {
    const scores = await scoreArchetypes(q, ctx);
    // Stable sort keeps list order for ties, as the spec asks.
    const ranked = [...scores].sort((a, b) => b.score - a.score);
    const best = ranked[0]!;
    return { archetype: best.id, label: ARCHETYPE_LABEL[best.id], why: ranked.slice(0, 3) };
  },
  a11yText: (p) => `You're ${p.label}: ${p.why[0]?.reason ?? ''}.`,
});
