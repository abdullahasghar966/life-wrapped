import { MIN_ACTIVE_DAYS_FOR_CLOCK } from '../constants';
import { hour12, pct } from '../copy';
import { spotifyMusicAll } from '../filters';
import { argmax, daypartTotals, define, hourly, one, type Daypart } from '../helpers';

export type ListeningPersona = 'Night Owl' | 'Early Bird' | 'Daytime' | 'Evening';

export const PERSONA_BY_DAYPART: Record<Daypart, ListeningPersona> = {
  night: 'Night Owl',
  morning: 'Early Bird',
  afternoon: 'Daytime',
  evening: 'Evening',
};

export interface SpotifyClock {
  /** Music minutes per local hour, 0–23. */
  hours: number[];
  peakHour: number;
  persona: ListeningPersona;
  /** Share of minutes in the persona's daypart. */
  personaShare: number;
}

export default define<SpotifyClock>({
  id: 'spotify.clock',
  deck: 'spotify',
  order: 7,
  title: 'Listening clock',
  async requires(q, ctx) {
    const [w, p] = spotifyMusicAll(ctx);
    const r = await one<{ d: number }>(
      q,
      `SELECT COUNT(DISTINCT local_date)::DOUBLE AS d FROM spotify_plays WHERE ${w}`,
      p,
    );
    return (r?.d ?? 0) >= MIN_ACTIVE_DAYS_FOR_CLOCK;
  },
  async run(q, ctx) {
    const [w, p] = spotifyMusicAll(ctx);
    const rows = await q<{ h: number; v: number }>(
      `SELECT local_hour::DOUBLE AS h, ROUND(SUM(ms_played) / 60000.0)::DOUBLE AS v
       FROM spotify_plays WHERE ${w} GROUP BY local_hour`,
      p,
    );
    const hours = hourly(rows);
    const parts = daypartTotals(hours);
    const total = Object.values(parts).reduce((a, b) => a + b, 0);
    const top = (Object.keys(parts) as Daypart[]).reduce((a, b) => (parts[b] > parts[a] ? b : a));
    return {
      hours,
      peakHour: argmax(hours),
      persona: PERSONA_BY_DAYPART[top],
      personaShare: Math.round((parts[top] / Math.max(1, total)) * 1000) / 1000,
    };
  },
  a11yText: (p) =>
    `Your peak listening hour was ${hour12(p.peakHour)}. ${pct(p.personaShare)} of your listening fits the ${p.persona} pattern.`,
});
