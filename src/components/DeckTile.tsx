import Link from 'next/link';
import type { DeckId } from '@/engine/types';
import { DECKS } from '@/story/decks';
import { PLATFORM_COLORS, THEMES, themeStyle, type ThemeTokens } from '@/story/themes';

/** A small 9:16 preview of a deck in its own theme (colour, type and one signature shape). */
export function DeckTile({ deck, href, sample }: { deck: DeckId; href: string; sample?: boolean }) {
  const meta = DECKS[deck];
  const t = THEMES[meta.theme];
  return (
    <Link
      href={href}
      data-theme={t.id}
      style={themeStyle(t)}
      className="group relative flex aspect-[9/16] w-full flex-col justify-end overflow-hidden rounded-(--t-radius-frame) bg-(--t-bg) p-4 shadow-lg ring-1 ring-white/10 transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1"
      aria-label={`${meta.title}${sample ? ' (sample data)' : ''}`}
    >
      <TileArt deck={deck} t={t} />
      <span className="t-display relative text-[1.65rem] text-(--t-text)">{meta.title}</span>
      <span className="t-body relative mt-1 text-xs text-(--t-muted)">{meta.tagline}</span>
    </Link>
  );
}

function TileArt({ deck, t }: { deck: DeckId; t: ThemeTokens }) {
  const b = t.backdrops;
  switch (deck) {
    case 'spotify':
      return (
        <div aria-hidden className="absolute inset-0">
          <div
            className="absolute -top-6 -right-8 size-32 rounded-full"
            style={{ background: b[0]?.bg }}
          />
          <div
            className="absolute top-[38%] -left-6 h-9 w-28 rotate-[-12deg] rounded-full"
            style={{ background: b[1]?.bg }}
          />
          <div className="absolute top-5 left-5 flex h-10 items-end gap-1">
            {[0.5, 0.9, 0.65, 1, 0.4].map((h, i) => (
              <span
                key={i}
                className="w-2 rounded-full bg-(--t-accent)"
                style={{ height: `${h * 100}%` }}
              />
            ))}
          </div>
        </div>
      );
    case 'youtube':
      return (
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-x-4 top-5 aspect-video overflow-hidden rounded-(--t-radius-tile) bg-(--t-surface)">
            <div className="absolute top-1/2 left-1/2 size-0 -translate-x-1/3 -translate-y-1/2 border-y-[10px] border-l-[16px] border-y-transparent border-l-(--t-text)" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-(--t-muted)/40">
              <div className="h-full w-2/3 bg-(--t-accent)" />
            </div>
          </div>
        </div>
      );
    case 'netflix':
      return (
        <div aria-hidden className="absolute inset-0">
          <div
            className="absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-60"
            style={{ background: `radial-gradient(circle, ${t.accent}, transparent 70%)` }}
          />
          <div className="absolute inset-x-0 top-0 h-5 bg-(--t-bg)" />
          <div className="absolute top-[12%] left-[12%] aspect-[2/3] w-[38%] rounded-(--t-radius-tile) bg-(--t-surface) ring-1 ring-(--t-accent)/60" />
          <div className="absolute top-[15%] left-[56%] aspect-[2/3] w-[32%] rounded-(--t-radius-tile) bg-(--t-surface) ring-1 ring-(--t-muted)/30" />
        </div>
      );
    case 'life':
      return (
        <div aria-hidden className="absolute inset-0">
          {[
            [PLATFORM_COLORS.spotify, 'top-6 left-6'],
            [PLATFORM_COLORS.youtube, 'top-14 right-4'],
            [PLATFORM_COLORS.netflix, 'top-28 left-12'],
          ].map(([color, pos]) => (
            <div
              key={color}
              className={`absolute size-20 rounded-full opacity-60 blur-xl ${pos}`}
              style={{ background: color }}
            />
          ))}
        </div>
      );
  }
}
