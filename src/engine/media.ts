import { MEDIA_TOP_N } from './insights/constants';
import { inPeriod, spotifyPlays } from './insights/filters';
import type { DataCtx, QueryFn } from './insights/types';
import type { TopMedia } from './types';

/** spotify:track:<22 base-62 characters> */
const TRACK_URI = /^spotify:track:([0-9A-Za-z]{22})$/;
/** 11 URL-safe base-64 characters. */
const VIDEO_ID = /^[\w-]{11}$/;

export const trackIdFromUri = (uri: string | null | undefined): string | null =>
  TRACK_URI.exec(uri ?? '')?.[1] ?? null;

export const isVideoId = (id: string | null | undefined): id is string => VIDEO_ID.test(id ?? '');

export const EMPTY_MEDIA: TopMedia = { songs: [], videos: [] };

/**
 * The most-played songs (the same list, filters and order as the "Top 5 songs"
 * card, so private sessions stay out) and the most-watched videos in the period.
 * Only ids that match the platforms' formats are passed on, because the UI puts
 * them in a player URL.
 */
export async function topMedia(q: QueryFn, ctx: DataCtx): Promise<TopMedia> {
  const [sw, sp] = spotifyPlays(ctx);
  const songs = await q<{ track: string; artist: string; plays: number; uri: string | null }>(
    `SELECT track, COALESCE(artist, '') AS artist, COUNT(*)::DOUBLE AS plays, mode(track_uri) AS uri
     FROM spotify_plays WHERE ${sw}
     GROUP BY track, artist ORDER BY plays DESC, SUM(ms_played) DESC, track LIMIT ${MEDIA_TOP_N}`,
    sp,
  );
  const [vw, vp] = inPeriod(ctx);
  const videos = await q<{ videoId: string; title: string; channel: string | null; views: number }>(
    `SELECT video_id AS "videoId", arg_max(title, ts_utc) AS title,
            arg_max(channel, ts_utc) AS channel, COUNT(*)::DOUBLE AS views
     FROM youtube_watches WHERE ${vw} AND video_id IS NOT NULL AND title IS NOT NULL
     GROUP BY video_id ORDER BY views DESC, max(ts_utc) DESC, title LIMIT ${MEDIA_TOP_N * 2}`,
    vp,
  );
  return {
    songs: songs
      .filter((s) => s.track)
      .map(({ uri, ...s }) => ({ ...s, trackId: trackIdFromUri(uri) })),
    videos: videos.filter((v) => isVideoId(v.videoId)).slice(0, MEDIA_TOP_N),
  };
}
