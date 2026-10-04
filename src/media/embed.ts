/**
 * The only third-party content the app can show (ADR-040): the platforms' own
 * players, framed only after the person picks a song or video. `frame-src` in
 * next.config.ts lists exactly these origins.
 */
export const PLAYER_ORIGINS = {
  spotify: 'https://open.spotify.com',
  youtube: 'https://www.youtube-nocookie.com',
} as const;

const TRACK_ID = /^[0-9A-Za-z]{22}$/;
const VIDEO_ID = /^[\w-]{11}$/;

/** Spotify's embedded player for one track (ids are re-checked: they end up in a URL). */
export function spotifyEmbedUrl(trackId: string): string | null {
  return TRACK_ID.test(trackId) ? `${PLAYER_ORIGINS.spotify}/embed/track/${trackId}` : null;
}

/** YouTube's player in its privacy-enhanced mode, starting straight away (the pick is the click). */
export function youtubeEmbedUrl(videoId: string): string | null {
  return VIDEO_ID.test(videoId)
    ? `${PLAYER_ORIGINS.youtube}/embed/${videoId}?autoplay=1&playsinline=1&rel=0`
    : null;
}

/** For exports without track ids (Spotify's Account data): a search, opened in a new tab. */
export function spotifySearchUrl(track: string, artist: string): string {
  return `${PLAYER_ORIGINS.spotify}/search/${encodeURIComponent(`${track} ${artist}`.trim())}`;
}
