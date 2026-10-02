import { SPOTIFY_STREAK_MIN } from '../constants';
import { n } from '../copy';
import { define } from '../helpers';
import clock, { type ListeningPersona } from './clock';
import minutes from './minutes';
import { longestStreak } from './streak';
import topArtist from './topArtist';
import topTracks from './topTracks';

export interface SpotifySummary {
  minutes: number;
  topArtist: string | null;
  topTrack: { track: string; artist: string } | null;
  persona: ListeningPersona | null;
  streak: number | null;
}

export default define<SpotifySummary>({
  id: 'spotify.summary',
  deck: 'spotify',
  order: 12,
  title: 'Your year in sound, summarised',
  requires: () => true,
  async run(q, ctx) {
    const [m, artist, tracks, c, streak] = await Promise.all([
      minutes.run(q, ctx),
      (await topArtist.requires(q, ctx)) ? topArtist.run(q, ctx) : null,
      (await topTracks.requires(q, ctx)) ? topTracks.run(q, ctx) : null,
      (await clock.requires(q, ctx)) ? clock.run(q, ctx) : null,
      longestStreak(q, ctx),
    ]);
    const t = tracks?.tracks[0];
    return {
      minutes: m?.minutes ?? 0,
      topArtist: artist?.artist ?? null,
      topTrack: t ? { track: t.track, artist: t.artist } : null,
      persona: c?.persona ?? null,
      streak: streak && streak.days >= SPOTIFY_STREAK_MIN ? streak.days : null,
    };
  },
  a11yText: (p) =>
    [
      `Summary: ${n(p.minutes)} minutes of music.`,
      p.topArtist && `Top artist ${p.topArtist}.`,
      p.topTrack && `Top song ${p.topTrack.track}.`,
      p.persona && `Listening style: ${p.persona}.`,
      p.streak && `Longest streak ${p.streak} days.`,
    ]
      .filter(Boolean)
      .join(' '),
  share: (p) => ({
    cardType: 'spotify.summary',
    theme: 'sound',
    numbers: { minutes: p.minutes, ...(p.streak ? { streak: p.streak } : {}) },
    names: {
      ...(p.topArtist ? { topArtist: p.topArtist } : {}),
      ...(p.topTrack ? { topTrack: p.topTrack.track } : {}),
      ...(p.persona ? { persona: p.persona } : {}),
    },
  }),
});
