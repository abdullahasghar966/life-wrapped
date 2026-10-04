'use client';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { LifeSummary } from '@/engine/insights/life/summary';
import type { NetflixSummary } from '@/engine/insights/netflix/summary';
import type { SpotifySummary } from '@/engine/insights/spotify/summary';
import type { YoutubeSummary } from '@/engine/insights/youtube/summary';
import { useReducedMotion } from '@/story/runtime';
import { backdropStyle, THEMES, themeStyle, type ThemeId } from '@/story/themes';
import data from './preview.json';

const SLIDE_MS = 3600;
const nf = new Intl.NumberFormat('en-US');

const spotify = data.spotify as SpotifySummary;
const youtube = data.youtube as YoutubeSummary;
const netflix = data.netflix as NetflixSummary;
const life = data.life as LifeSummary;

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="t-body text-[4cqw] font-bold tracking-[0.12em] text-(--c-muted) uppercase">
      {children}
    </p>
  );
}

function SoundSlide() {
  const b = THEMES.sound.backdrops;
  return (
    <div
      style={backdropStyle(b[0]!)}
      className="flex h-full flex-col bg-(--c-bg) px-[7cqw] pt-[12cqw] pb-[7cqw] text-(--c-ink)"
    >
      <Eyebrow>Your year in sound</Eyebrow>
      {spotify.persona && (
        <p
          style={{ rotate: '-6deg' }}
          className="t-body mt-[6cqw] self-start rounded-full border-[0.6cqw] border-(--c-ink) px-[3.6cqw] py-[1.4cqw] text-[4.2cqw] font-extrabold"
        >
          {spotify.persona}
          {spotify.streak ? ` · ${spotify.streak}-day streak` : ''}
        </p>
      )}
      <p className="t-display mt-auto text-[23cqw] leading-[0.85]">{nf.format(spotify.minutes)}</p>
      <p className="t-display text-[9cqw]">minutes</p>
      <div className="mt-[6cqw] grid gap-[2.5cqw]">
        {[
          { label: 'Top artist', value: spotify.topArtist, bd: b[1]! },
          { label: 'Top song', value: spotify.topTrack?.track, bd: b[2]! },
        ]
          .filter((tile) => tile.value)
          .map(({ label, value, bd }) => (
            <div
              key={label}
              style={backdropStyle(bd)}
              className="rounded-[3cqw] bg-(--c-bg) px-[4cqw] py-[3cqw] text-(--c-ink)"
            >
              <p className="t-body text-[3.2cqw] font-bold tracking-[0.1em] text-(--c-muted) uppercase">
                {label}
              </p>
              <p className="t-display text-[8cqw]">{value}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

function WatchSlide() {
  const t = THEMES.watch;
  return (
    <div
      style={backdropStyle(t.backdrops[0]!)}
      className="flex h-full flex-col bg-(--c-bg) px-[7cqw] pt-[12cqw] pb-[7cqw] text-(--c-ink)"
    >
      <Eyebrow>Your year of watching</Eyebrow>
      {youtube.rabbitHole && (
        <p className="t-body mt-[5cqw] text-[4.4cqw] text-(--c-muted)">
          Deepest rabbit hole:{' '}
          <span className="t-display text-(--c-ink)">{youtube.rabbitHole.videos} videos</span> in a
          row
        </p>
      )}
      <p className="t-display mt-auto text-[25cqw] leading-[0.85]">{nf.format(youtube.videos)}</p>
      <p className="t-display text-[8cqw]">videos watched</p>
      <p className="t-body mt-[2cqw] text-[4.4cqw] text-(--c-muted)">
        ≈ {nf.format(youtube.hours)} hours (estimated)
      </p>
      <div className="mt-[6cqw] flex items-center gap-[3cqw] rounded-[3cqw] bg-(--t-surface) p-[3cqw]">
        <span
          aria-hidden
          className="t-display flex size-[12cqw] shrink-0 items-center justify-center rounded-full bg-(--c-accent) text-[5cqw] text-(--t-on-accent)"
        >
          PK
        </span>
        <span>
          <span className="t-body block text-[3.2cqw] text-(--c-muted)">Top channel</span>
          <span className="t-display block text-[6.4cqw]">{youtube.topChannel}</span>
        </span>
      </div>
      <div aria-hidden className="mt-[6cqw] h-[1.2cqw] rounded-full bg-white/25">
        <div className="relative h-full w-[68%] rounded-full bg-(--c-accent)">
          <span className="absolute top-1/2 right-0 size-[3.4cqw] translate-x-1/2 -translate-y-1/2 rounded-full bg-(--c-accent)" />
        </div>
      </div>
    </div>
  );
}

function BingeSlide() {
  const t = THEMES.binge;
  const credits = [
    ['Running time', `${nf.format(netflix.hours)} hours`],
    ['Featuring', netflix.topSeries],
    ['Binge record', netflix.binge ? `${netflix.binge.count} episodes in one day` : null],
  ].filter(([, v]) => v);
  return (
    <div
      style={backdropStyle(t.backdrops[0]!)}
      className="relative flex h-full flex-col items-center bg-(--c-bg) px-[7cqw] pt-[12cqw] pb-[7cqw] text-center text-(--c-ink)"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 18%, color-mix(in srgb, var(--c-accent) 55%, transparent), transparent 62%)',
        }}
      />
      <p className="t-body relative text-[3.2cqw] font-semibold tracking-[0.3em] text-(--c-muted) uppercase">
        A Life, Wrapped production
      </p>
      <p className="t-display relative mt-[8cqw] text-[19cqw] leading-[0.86]">
        Your year on screen.
      </p>
      <dl className="relative mt-auto grid w-full gap-[3cqw]">
        {credits.map(([label, value]) => (
          <div key={label}>
            <dt className="t-body text-[3cqw] font-semibold tracking-[0.3em] text-(--c-muted) uppercase">
              {label}
            </dt>
            <dd className="t-display text-[7cqw] leading-none">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ReceiptSlide() {
  const t = THEMES.receipt;
  return (
    <div
      style={backdropStyle(t.backdrops[1]!)}
      className="flex h-full flex-col bg-(--c-bg) px-[7cqw] pt-[12cqw] pb-[7cqw] text-(--c-ink)"
    >
      <p className="font-mono text-[3.6cqw] font-medium tracking-[0.12em] text-(--c-muted) uppercase">
        Your online life
      </p>
      <p className="t-display mt-[8cqw] text-[27cqw] leading-[0.8]">
        {life.estimated ? '≈' : ''}
        {nf.format(life.hours)}
      </p>
      <p className="t-display text-[11cqw] leading-none">Hours online</p>
      <p
        style={{ rotate: '-5deg' }}
        className="t-display mt-[6cqw] self-start bg-(--c-accent) px-[3cqw] pt-[1.4cqw] pb-[0.8cqw] text-[8cqw] leading-none text-(--t-on-accent)"
      >
        That’s {life.estimated ? '≈ ' : ''}
        {nf.format(life.days)} days
      </p>
      <p className="mt-auto font-mono text-[3.4cqw] text-(--c-muted) uppercase">You’re</p>
      <p className="t-display text-[11cqw] leading-[0.9]">{life.label}</p>
    </div>
  );
}

const SLIDES: Array<{ theme: ThemeId; name: string; Slide: () => ReactNode }> = [
  { theme: 'sound', name: 'Spotify', Slide: SoundSlide },
  { theme: 'watch', name: 'YouTube', Slide: WatchSlide },
  { theme: 'binge', name: 'Netflix', Slide: BingeSlide },
  { theme: 'receipt', name: 'your online life', Slide: ReceiptSlide },
];

/**
 * The landing page's mini story: the four summary cards of the sample, each in
 * its deck's theme, drawn from a committed JSON (no engine, no GSAP). It moves
 * on by itself unless reduced motion is on, and can always be paused (WCAG 2.2.2).
 */
export function HeroPreview({ frameClassName }: { frameClassName?: string }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  // Only the first card is drawn until the browser is idle: each card uses its
  // theme's fonts, which would otherwise compete with the first paint.
  const [allDrawn, setAllDrawn] = useState(false);
  const playing = !reduced && !paused && !held;

  useEffect(() => {
    const draw = () => setAllDrawn(true);
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(draw, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    // Safari has no requestIdleCallback.
    const id = setTimeout(draw, 500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [playing, index]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Preview of the four stories, with sample data"
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
        className={`[container-type:inline-size] relative aspect-[9/16] w-[min(72vw,290px)] overflow-hidden rounded-[18px] shadow-[0_24px_40px_-20px_rgb(22_19_15/0.55)] ${frameClassName ?? ''}`}
      >
        {SLIDES.map(({ theme, name, Slide }, i) => (
          <div
            key={theme}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}: ${name}`}
            aria-hidden={i !== index}
            inert={i !== index}
            data-theme={theme}
            style={themeStyle(THEMES[theme])}
            className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
              i === index ? 'scale-100 opacity-100' : 'pointer-events-none scale-[1.04] opacity-0'
            }`}
          >
            {(allDrawn || i === index) && <Slide />}
          </div>
        ))}
        <div aria-hidden className="absolute inset-x-[5cqw] top-[4cqw] z-10 flex gap-[1.5cqw]">
          {SLIDES.map(({ theme }, i) => (
            <span key={theme} className="h-[1cqw] flex-1 overflow-hidden rounded-full bg-white/30">
              <span
                key={`${theme}-${index}`}
                className="block h-full origin-left rounded-full bg-white"
                style={
                  {
                    transform: i < index || (i === index && !playing) ? 'scaleX(1)' : 'scaleX(0)',
                    animation:
                      i === index && playing
                        ? `preview-progress ${SLIDE_MS}ms linear forwards`
                        : 'none',
                  } as CSSProperties
                }
              />
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {SLIDES.map(({ theme, name }, i) => (
          <button
            key={theme}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show the ${name} card`}
            aria-current={i === index}
            className="group flex size-6 items-center justify-center rounded-full"
          >
            <span
              className={`size-2.5 rounded-full transition-colors ${i === index ? 'bg-foreground' : 'bg-muted-foreground/40 group-hover:bg-muted-foreground'}`}
            />
          </button>
        ))}
        {!reduced && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play the preview' : 'Pause the preview'}
            aria-pressed={paused}
            className="text-muted-foreground hover:text-foreground ml-2 rounded-full p-1.5"
          >
            {/* Inline icons keep an icon library out of the landing page's bundle. */}
            <svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="currentColor">
              {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
