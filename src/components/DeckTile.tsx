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
      className="group border-ink relative flex aspect-[9/16] w-full flex-col justify-end overflow-hidden rounded-(--t-radius-frame) border-[1.5px] bg-(--t-bg) p-4 shadow-[4px_4px_0_0_var(--color-ink)] transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 motion-safe:hover:[transform:perspective(700px)_rotateX(7deg)_rotateY(-11deg)_translateY(-4px)] motion-safe:focus-visible:[transform:perspective(700px)_rotateX(7deg)_rotateY(-11deg)_translateY(-4px)]"
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
      // A slip printed with one line per platform: shapes only, no numbers.
      return (
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-x-5 top-5 rotate-[-4deg] drop-shadow-md">
            <div className="flex flex-col gap-2 bg-(--t-surface) px-3 pt-3 pb-3">
              <span className="mx-auto h-1.5 w-1/2 bg-(--t-text)" />
              <span className="border-t border-dashed border-(--t-text)/40" />
              {(['spotify', 'youtube', 'netflix'] as const).map((p, i) => (
                <span key={p} className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0" style={{ background: PLATFORM_COLORS[p] }} />
                  <span className="flex-1 border-b border-dotted border-(--t-text)/50" />
                  <span className="h-1.5 bg-(--t-text)" style={{ width: `${18 - i * 4}%` }} />
                </span>
              ))}
              <span className="flex h-2.5 border border-(--t-text)">
                <span className="w-[55%]" style={{ background: PLATFORM_COLORS.spotify }} />
                <span
                  className="w-[33%] border-l border-(--t-text)"
                  style={{ background: PLATFORM_COLORS.youtube }}
                />
                <span
                  className="flex-1 border-l border-(--t-text)"
                  style={{ background: PLATFORM_COLORS.netflix }}
                />
              </span>
              <span className="mt-1 h-5 bg-[repeating-linear-gradient(90deg,var(--t-text)_0_2px,transparent_2px_4px,var(--t-text)_4px_5px,transparent_5px_8px)]" />
            </div>
            <svg
              viewBox="0 0 100 6"
              preserveAspectRatio="none"
              className="block h-2 w-full text-(--t-surface)"
            >
              <path
                d={`M0 0 ${Array.from({ length: 12 }, (_, i) => `L${i * 8.33 + 4.17} 6 L${(i + 1) * 8.33} 0`).join(' ')} Z`}
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="absolute top-[52%] right-3 rotate-[8deg] bg-(--t-accent) px-1.5 py-0.5 font-mono text-[0.6rem] font-medium tracking-widest text-(--t-on-accent) uppercase">
            All of it
          </span>
        </div>
      );
  }
}
