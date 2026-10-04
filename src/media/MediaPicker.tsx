'use client';
import { ExternalLink, Play, ShieldAlert, WifiOff } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TopMedia, TopSong, TopVideo } from '@/engine/types';
import { fmtInt } from '@/lib/format';
import { Cover, Thumbnail } from '@/story/art/Art';
import { spotifySearchUrl } from './embed';

export type MediaKind = 'songs' | 'videos';

export type Playing =
  { kind: 'song'; song: TopSong; rank: number } | { kind: 'video'; video: TopVideo; rank: number };

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

const COPY = {
  songs: {
    title: 'Add a soundtrack?',
    description: 'Pick one of your most-played songs to play while you watch your stories.',
    privacy:
      'Playing loads Spotify’s player on this page, so Spotify learns which song you picked, sees your IP address and may set its own cookies. Nothing else from your files is sent.',
  },
  videos: {
    title: 'Watch along?',
    description: 'Pick one of your most-watched videos to play while you go through your stories.',
    privacy:
      'Playing loads YouTube’s player (in its privacy-enhanced mode) on this page, so YouTube learns which video you picked and sees your IP address. Nothing else from your files is sent.',
  },
} as const;

/**
 * Offers the person's own top songs or videos to play alongside the stories
 * (ADR-040). Nothing is loaded from Spotify or YouTube until they pick one.
 */
export function MediaPicker({
  kind,
  media,
  playing,
  onPick,
  onOpenChange,
}: {
  kind: MediaKind | null;
  media: TopMedia;
  playing: Playing | null;
  onPick: (p: Playing) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const copy = COPY[kind ?? 'songs'];
  const replaces =
    playing && kind && (playing.kind === 'song') !== (kind === 'songs')
      ? `This replaces the ${playing.kind} that’s playing.`
      : null;

  return (
    <Dialog open={kind !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase">{copy.title}</DialogTitle>
          <DialogDescription>
            {copy.description} {replaces}
          </DialogDescription>
        </DialogHeader>

        {!online && (
          <p role="status" className="bg-muted flex items-center gap-2 rounded-lg p-3 text-sm">
            <WifiOff aria-hidden className="size-4 shrink-0" />
            You’re offline. Playing needs a connection; your stories don’t.
          </p>
        )}

        <ol className="divide-border divide-y" data-testid="media-list">
          {kind === 'songs' &&
            media.songs.map((song, i) => (
              <li key={`${song.track}-${song.artist}`} className="flex items-center gap-3 py-2.5">
                <span aria-hidden className="font-display w-5 text-center text-2xl leading-none">
                  {i + 1}
                </span>
                <Cover
                  name={`${song.track} · ${song.artist}`}
                  className="size-11 shrink-0 rounded"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{song.track}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {song.artist} · {fmtInt(song.plays)} {song.plays === 1 ? 'play' : 'plays'}
                  </span>
                </span>
                {song.trackId ? (
                  <Button
                    size="sm"
                    disabled={!online}
                    onClick={() => onPick({ kind: 'song', song, rank: i + 1 })}
                    aria-label={`Play ${song.track} by ${song.artist}`}
                  >
                    <Play aria-hidden /> Play
                  </Button>
                ) : (
                  // Account data exports have no track ids, so the song can only be searched for.
                  <a
                    href={spotifySearchUrl(song.track, song.artist)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold whitespace-nowrap underline underline-offset-4"
                  >
                    Find on Spotify <ExternalLink aria-hidden className="inline size-3" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </li>
            ))}
          {kind === 'videos' &&
            media.videos.map((video, i) => (
              <li key={video.videoId} className="flex items-center gap-3 py-2.5">
                <span aria-hidden className="font-display w-5 text-center text-2xl leading-none">
                  {i + 1}
                </span>
                <Thumbnail
                  name={video.title}
                  initials={false}
                  className="h-11 w-[4.9rem] shrink-0 rounded"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{video.title}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {video.channel ? `${video.channel} · ` : ''}
                    {fmtInt(video.views)} {video.views === 1 ? 'view' : 'views'}
                  </span>
                </span>
                <Button
                  size="sm"
                  disabled={!online}
                  onClick={() => onPick({ kind: 'video', video, rank: i + 1 })}
                  aria-label={`Play ${video.title}`}
                >
                  <Play aria-hidden /> Play
                </Button>
              </li>
            ))}
        </ol>

        <p className="text-muted-foreground flex gap-2 text-xs leading-relaxed">
          <ShieldAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {copy.privacy}
        </p>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
