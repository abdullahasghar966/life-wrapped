'use client';
import { ArrowDownUp, X } from 'lucide-react';
import { useState } from 'react';
import { spotifyEmbedUrl, youtubeEmbedUrl } from './embed';
import type { Playing } from './MediaPicker';

// Framed players can't navigate this tab away (no allow-top-navigation).
const SANDBOX =
  'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-storage-access-by-user-activation';

/**
 * The player for the song or video the person picked (ADR-040), in the app's own
 * receipt style. It stays put while the stories play and move between decks. On
 * phones it floats over the story and can move between the bottom and the top.
 * YouTube's player keeps the 200 px minimum height its terms ask for.
 */
export function MediaDock({ playing, onClose }: { playing: Playing; onClose: () => void }) {
  const [top, setTop] = useState(false);
  const song = playing.kind === 'song' ? playing.song : null;
  const video = playing.kind === 'video' ? playing.video : null;
  const src = song?.trackId
    ? spotifyEmbedUrl(song.trackId)
    : video
      ? youtubeEmbedUrl(video.videoId)
      : null;
  if (!src) return null;
  const name = song ? `${song.track} by ${song.artist}` : video!.title;

  return (
    <aside
      aria-label="Now playing"
      data-testid="media-dock"
      className={`border-ink bg-paper-2 text-ink fixed inset-x-3 z-50 border-[1.5px] shadow-[4px_4px_0_0_var(--color-ink)] sm:inset-x-auto sm:top-auto sm:bottom-12 sm:left-6 ${
        top
          ? 'top-[calc(env(safe-area-inset-top)+5.5rem)]'
          : 'bottom-[calc(env(safe-area-inset-bottom)+5rem)]'
      } ${song ? 'sm:w-80' : 'sm:w-[23.5rem]'}`}
    >
      <div className="border-ink/30 flex items-center gap-2 border-b border-dashed px-2.5 py-1.5">
        <span aria-hidden className="bg-red size-2 animate-pulse" />
        <span className="font-mono text-[0.68rem] tracking-[0.08em] uppercase">
          Now playing · your #{playing.rank} {song ? 'song' : 'video'}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTop((t) => !t)}
            aria-label={top ? 'Move the player to the bottom' : 'Move the player to the top'}
            className="hover:bg-ink/10 rounded p-1 sm:hidden"
          >
            <ArrowDownUp aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stop and close the player"
            className="hover:bg-ink/10 rounded p-1"
          >
            <X aria-hidden className="size-4" />
          </button>
        </span>
      </div>
      <iframe
        key={src}
        src={src}
        title={`${song ? 'Spotify' : 'YouTube'} player: ${name}`}
        sandbox={SANDBOX}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        // YouTube refuses to play without knowing which site embeds it; only the origin is sent.
        referrerPolicy={video ? 'strict-origin-when-cross-origin' : 'no-referrer'}
        allowFullScreen={!!video}
        className={`block w-full border-0 ${song ? 'h-20' : 'h-[200px]'}`}
      />
    </aside>
  );
}
