import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CSSProperties, ReactNode } from 'react';
import { PLATFORM_COLORS } from '@/story/themes/receipt';
import { SHARE_TITLES } from './cards';
import type { ValidSharePayload } from './schema';

export const OG_SIZE = { width: 1200, height: 630 };

const FONT_FILES = [
  { name: 'IBM Plex Sans', file: 'ibm-plex-sans-latin-400-normal.woff', weight: 400 },
  { name: 'IBM Plex Sans', file: 'ibm-plex-sans-latin-600-normal.woff', weight: 600 },
  { name: 'IBM Plex Mono', file: 'ibm-plex-mono-latin-500-normal.woff', weight: 500 },
  { name: 'Archivo', file: 'archivo-extra-condensed-900.ttf', weight: 900 },
  { name: 'Figtree', file: 'figtree-latin-900-normal.woff', weight: 900 },
  { name: 'Roboto Condensed', file: 'roboto-condensed-latin-800-normal.woff', weight: 800 },
  { name: 'Bebas Neue', file: 'bebas-neue-latin-400-normal.woff', weight: 400 },
] as const;

type Fonts = Array<{
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 800 | 900;
  style: 'normal';
}>;
let fonts: Promise<Fonts> | undefined;

function loadFonts(): Promise<Fonts> {
  fonts ??= Promise.all(
    FONT_FILES.map(async (f) => ({
      name: f.name,
      weight: f.weight,
      style: 'normal' as const,
      data: await readFile(join(process.cwd(), 'assets', 'fonts', f.file)),
    })),
  );
  return fonts;
}

/**
 * Code points every embedded font covers (their "latin" subset). For anything
 * else next/og would download a fallback font or emoji from a third-party CDN,
 * sending the text along, so names outside this set are left off the image.
 */
const COVERED: ReadonlyArray<readonly [number, number]> = [
  [0x20, 0x7e],
  [0xa0, 0xff],
  [0x131, 0x131],
  [0x152, 0x153],
  [0x2c6, 0x2c6],
  [0x2da, 0x2da],
  [0x2dc, 0x2dc],
  [0x2013, 0x2014],
  [0x2018, 0x201a],
  [0x201c, 0x201e],
  [0x2020, 0x2022],
  [0x2026, 0x2026],
  [0x2030, 0x2030],
  [0x2039, 0x203a],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
];

export function ogText(s: string | null | undefined, max = 28): string | null {
  if (!s) return null;
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    if (!COVERED.some(([a, b]) => c >= a && c <= b)) return null;
  }
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

const PLATFORM_LABEL = { spotify: 'Spotify', youtube: 'YouTube', netflix: 'Netflix' } as const;

const nf = new Intl.NumberFormat('en-US');
const fmt = (v: number | undefined) => nf.format(Math.round(v ?? 0));

/** "≈" drawn as a shape: the embedded fonts' latin subset doesn't include it. */
function Approx({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 24 18"
      style={{ marginRight: size * 0.18, flexShrink: 0 }}
    >
      <path
        d="M2 6.5 C6 2.5 9 2.5 12 6.5 S18 10.5 22 6.5"
        stroke={color}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M2 13.5 C6 9.5 9 9.5 12 13.5 S18 17.5 22 13.5"
        stroke={color}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface Look {
  bg: string;
  ink: string;
  muted: string;
  display: {
    fontFamily: string;
    fontWeight: number;
    letterSpacing: number;
    textTransform?: 'uppercase';
  };
  decor: ReactNode;
  badge: CSSProperties;
}

interface Model {
  kicker: string;
  big: string;
  approx: boolean;
  unit: string;
  facts: Array<{ label: string; value: string; approx?: boolean }>;
  /** Shown to the right of the text (the Life card's receipt). */
  side?: ReactNode;
}

const FILL: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
};

function circle(cx: number, cy: number, r: number, color: string): CSSProperties {
  return {
    position: 'absolute',
    left: cx - r,
    top: cy - r,
    width: r * 2,
    height: r * 2,
    borderRadius: r,
    background: color,
  };
}

const THUMBS = [
  ['#3A3A3A', '#1F1F1F', 100],
  ['#4A2A2F', '#202020', 72],
  ['#2C3440', '#1C1C1C', 100],
] as const;

const LOOKS: Record<ValidSharePayload['theme'], Look> = {
  sound: {
    bg: '#C6F432',
    ink: '#121212',
    muted: '#2B3A06',
    display: { fontFamily: 'Figtree', fontWeight: 900, letterSpacing: -7 },
    decor: (
      <>
        <div style={circle(1090, 110, 330, '#FF6FB5')} />
        <div style={circle(1150, 560, 210, '#3D5AFE')} />
      </>
    ),
    badge: { background: '#121212', color: '#C6F432' },
  },
  watch: {
    bg: '#0F0F0F',
    ink: '#F1F1F1',
    muted: '#AAAAAA',
    display: { fontFamily: 'Roboto Condensed', fontWeight: 800, letterSpacing: -2 },
    decor: (
      <>
        {/* A column of watched-video tiles: generic shapes with a red "watched" bar. */}
        {THUMBS.map(([from, to, watched], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 892 + (i % 2) * 36,
              top: 128 + i * 128,
              width: 236,
              height: 112,
              display: 'flex',
              borderRadius: 12,
              overflow: 'hidden',
              backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: `${watched}%`,
                height: 5,
                background: '#FF0033',
              }}
            />
          </div>
        ))}
        {/* The scrubber: explicit sizes, since satori doesn't stretch left/right insets. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: OG_SIZE.height - 8,
            width: OG_SIZE.width,
            height: 8,
            display: 'flex',
            background: '#3F3F3F',
          }}
        >
          <div style={{ width: OG_SIZE.width * 0.64, height: 8, background: '#FF0033' }} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: OG_SIZE.width * 0.64 - 11,
            top: OG_SIZE.height - 15,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: '#FF0033',
          }}
        />
      </>
    ),
    badge: { background: '#272727', color: '#F1F1F1' },
  },
  binge: {
    bg: '#000000',
    ink: '#FFFFFF',
    muted: '#B3B3B3',
    display: {
      fontFamily: 'Bebas Neue',
      fontWeight: 400,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    decor: (
      <div
        style={{
          ...FILL,
          backgroundImage:
            'radial-gradient(circle at 85% 0%, rgba(229,9,20,0.6), rgba(229,9,20,0) 62%)',
        }}
      />
    ),
    badge: { background: '#FFFFFF', color: '#000000' },
  },
  receipt: {
    bg: '#F3EFE6',
    ink: '#16130F',
    muted: '#5A534A',
    display: {
      fontFamily: 'Archivo',
      fontWeight: 900,
      letterSpacing: 0,
      textTransform: 'uppercase',
    },
    decor: null,
    badge: { background: '#FF3D12', color: '#16130F', borderRadius: 0 },
  },
};

function model(p: ValidSharePayload): Model {
  const kicker = SHARE_TITLES[p.cardType];
  const facts: Model['facts'] = [];
  const add = (label: string, value: string | null) => {
    if (value) facts.push({ label, value });
  };
  switch (p.cardType) {
    case 'spotify.summary': {
      const { numbers: n, names: s } = p;
      add('Top artist', ogText(s.topArtist));
      add('Top track', ogText(s.topTrack));
      if (n.streak) add('Longest streak', `${fmt(n.streak)} days`);
      add('Listening style', ogText(s.persona));
      return { kicker, big: fmt(n.minutes), approx: false, unit: 'minutes of listening', facts };
    }
    case 'youtube.summary': {
      const { numbers: n, names: s } = p;
      facts.push({ label: 'Watch time', value: `${fmt(n.hours)} hours`, approx: true });
      add('Top channel', ogText(s.topChannel));
      if (n.rabbitHoleVideos) add('Deepest rabbit hole', `${fmt(n.rabbitHoleVideos)} videos`);
      return { kicker, big: fmt(n.videos), approx: false, unit: 'videos watched', facts };
    }
    case 'netflix.summary': {
      const { numbers: n, names: s } = p;
      add('Featuring', ogText(s.topSeries));
      if (n.bingeEpisodes) add('Binge record', `${fmt(n.bingeEpisodes)} episodes in a day`);
      const persona = ogText(s.persona);
      add('As', persona && `The ${persona}`);
      return { kicker, big: fmt(n.hours), approx: false, unit: 'hours on screen', facts };
    }
    case 'life.summary': {
      const { numbers: n, names: s } = p;
      // YouTube time is estimated, so a total that includes it (and its days) is too.
      const approx = (n.youtubeShare ?? 0) > 0;
      add('Mostly on', ogText(s.top));
      if (n.days) facts.push({ label: 'That’s', value: `${fmt(n.days)} whole days`, approx });
      const parts = (['spotify', 'youtube', 'netflix'] as const)
        .map((k) => ({ k, share: n[`${k}Share`] ?? 0 }))
        .filter((x) => x.share > 0);
      const side = (
        <ReceiptBox
          lines={[
            ...parts.map(
              ({ k, share }) => [PLATFORM_LABEL[k], `${Math.round(share * 100)}%`] as const,
            ),
            ['Total', `${fmt(n.hours)} h`],
          ]}
          bar={parts.map(({ k, share }) => ({ color: PLATFORM_COLORS[k], share }))}
          approxTotal={approx}
          footer={ogText(s.archetype, 22)}
        />
      );
      return {
        kicker,
        big: fmt(n.hours),
        approx,
        unit: 'hours online',
        facts,
        side,
      };
    }
  }
}

function Frame({ look, children, sample }: { look: Look; children: ReactNode; sample: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        padding: '60px 72px 64px',
        background: look.bg,
        color: look.ink,
        fontFamily: 'IBM Plex Sans',
        fontWeight: 400,
      }}
    >
      {/* One full-bleed layer: satori offsets absolute children by their parent's padding. */}
      <div style={FILL}>{look.decor}</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 20,
          fontFamily: 'IBM Plex Mono',
          fontWeight: 500,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        <div style={{ display: 'flex', color: look.muted }}>Life, Wrapped</div>
        {sample && (
          <div
            style={{
              display: 'flex',
              borderRadius: 999,
              padding: '8px 18px',
              fontSize: 17,
              ...look.badge,
            }}
          >
            Sample data
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/** A printed receipt: paper, monospaced lines with dotted leaders, a torn edge. */
function ReceiptBox({
  lines,
  bar,
  approxTotal = false,
  footer,
  title = 'Your year, itemised',
}: {
  lines: Array<readonly [string, string]>;
  bar?: Array<{ color: string; share: number }>;
  approxTotal?: boolean;
  footer?: string | null;
  title?: string;
}) {
  const row = (label: string, value: string, i: number) => (
    <div key={label} style={{ display: 'flex', alignItems: 'flex-end', marginTop: i ? 8 : 0 }}>
      <div style={{ display: 'flex' }}>{label.toUpperCase()}</div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          borderBottom: '2px dashed #8A8278',
          margin: '0 8px 6px',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {label === 'Total' && approxTotal && <Approx size={20} color="#16130F" />}
        {value.toUpperCase()}
      </div>
    </div>
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 330,
        marginLeft: 48,
        transform: 'rotate(3deg)',
        alignSelf: 'center',
        filter: 'drop-shadow(0 14px 18px rgba(22, 19, 15, 0.16))',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFDF8',
          color: '#16130F',
          padding: '26px 26px 20px',
          fontFamily: 'IBM Plex Mono',
          fontWeight: 500,
          fontSize: 19,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', letterSpacing: 4 }}>
          LIFE, WRAPPED
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: 15,
            letterSpacing: 2,
            color: '#5A534A',
            marginTop: 4,
          }}
        >
          {title.toUpperCase()}
        </div>
        <div style={{ display: 'flex', borderTop: '2px dashed #8A8278', margin: '14px 0' }} />
        {lines.map(([label, value], i) => row(label, value, i))}
        {bar && bar.length > 0 && (
          <div style={{ display: 'flex', height: 18, marginTop: 12, border: '2px solid #16130F' }}>
            {bar.map((b, i) => (
              <div
                key={b.color}
                style={{
                  display: 'flex',
                  width: `${b.share * 100}%`,
                  background: b.color,
                  borderLeft: i ? '2px solid #16130F' : 'none',
                }}
              />
            ))}
          </div>
        )}
        <div style={{ display: 'flex', borderTop: '2px dashed #8A8278', margin: '14px 0 10px' }} />
        {footer && <div style={{ display: 'flex' }}>{`YOU ARE: ${footer.toUpperCase()}`}</div>}
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: 3, height: 40, marginTop: 14 }}
        >
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              style={{ width: i % 3 === 0 ? 5 : 2, background: i % 2 ? '#FFFDF8' : '#16130F' }}
            />
          ))}
        </div>
      </div>
      {/* The torn edge: a zigzag in the paper's colour. */}
      <svg width={330} height={12} viewBox="0 0 330 12" style={{ display: 'flex' }}>
        <path
          d={`M0 0 ${Array.from({ length: 22 }, (_, i) => `L${i * 15 + 7.5} 12 L${(i + 1) * 15} 0`).join(' ')} Z`}
          fill="#FFFDF8"
        />
      </svg>
    </div>
  );
}

function ShareImage({ payload, sample }: { payload: ValidSharePayload; sample: boolean }) {
  const look = LOOKS[payload.theme];
  const m = model(payload);
  return (
    <Frame look={look} sample={sample}>
      <div style={{ display: 'flex', marginTop: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              ...look.display,
              letterSpacing: look.display.textTransform ? 3 : 0,
            }}
          >
            {m.kicker}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: m.big.length > 7 ? 150 : 176,
              lineHeight: 0.95,
              marginTop: 8,
              ...look.display,
            }}
          >
            {m.approx && <Approx size={96} color={look.ink} />}
            {m.big}
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, marginTop: 6 }}>
            {m.unit}
          </div>
          <div style={{ display: 'flex', gap: 48, marginTop: 36 }}>
            {m.facts.slice(0, m.side ? 2 : 3).map((f) => (
              <div
                key={f.label}
                style={{ display: 'flex', flexDirection: 'column', maxWidth: 330 }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 17,
                    fontFamily: 'IBM Plex Mono',
                    fontWeight: 500,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: look.muted,
                  }}
                >
                  {f.label}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 32,
                    fontWeight: 600,
                    marginTop: 6,
                  }}
                >
                  {f.approx && <Approx size={26} color={look.ink} />}
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        {m.side}
      </div>
    </Frame>
  );
}

function GenericImage() {
  const look = LOOKS.receipt;
  return (
    <Frame look={look} sample={false}>
      <div style={{ display: 'flex', marginTop: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: 132,
              lineHeight: 0.86,
              maxWidth: 680,
              ...look.display,
            }}
          >
            Your whole online life, wrapped.
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, marginTop: 28 }}>
            Without it ever&nbsp;
            <span style={{ background: '#FF3D12', padding: '0 6px' }}>leaving your device</span>.
          </div>
        </div>
        <ReceiptBox
          title="Your year, itemised"
          lines={[
            ['Spotify', 'read'],
            ['YouTube', 'read'],
            ['Netflix', 'read'],
            ['Uploaded', 'nothing'],
          ]}
        />
      </div>
    </Frame>
  );
}

/** The link preview for a shared card, in that card's theme. */
export async function renderShareImage(
  payload: ValidSharePayload,
  sample: boolean,
): Promise<ImageResponse> {
  return new ImageResponse(<ShareImage payload={payload} sample={sample} />, {
    ...OG_SIZE,
    fonts: await loadFonts(),
  });
}

/** The site's own preview, also used when a shared card doesn't exist. */
export async function renderGenericImage(): Promise<ImageResponse> {
  return new ImageResponse(<GenericImage />, { ...OG_SIZE, fonts: await loadFonts() });
}
