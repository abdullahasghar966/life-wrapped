import {
  ArrowRight,
  EyeOff,
  FileDown,
  FolderOpen,
  Lock,
  Play,
  ShieldCheck,
  Trash2,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { HeroPreview } from '@/landing/HeroPreview';
import { PLATFORM_COLORS } from '@/story/themes';

const STEPS = [
  {
    icon: FileDown,
    title: 'Ask for your data',
    body: 'Spotify, YouTube and Netflix each let you download your history. It arrives by email: within minutes from Google Takeout, and within days or a few weeks from the others.',
  },
  {
    icon: FolderOpen,
    title: 'Drop the files here',
    body: 'Zips, folders or single files. Each export is recognised by what’s inside, even if your language renamed it, and read inside this browser tab.',
  },
  {
    icon: Play,
    title: 'Play your stories',
    body: 'Music, videos, shows, and all of it together, each styled like the app it’s about. Save any card as an image, or share a summary card if you like.',
  },
] as const;

const PROMISES = [
  { icon: Lock, text: 'No uploads. Your files are read in your browser and never sent anywhere.' },
  { icon: EyeOff, text: 'No accounts, no analytics, no cookies, no third-party scripts.' },
  {
    icon: ShieldCheck,
    text: 'IP addresses, device details and other sensitive fields are dropped as files are read.',
  },
  { icon: Trash2, text: 'Nothing is saved. Close the tab and it’s gone.' },
] as const;

const EXPORTS = [
  {
    platform: 'spotify',
    name: 'Spotify',
    what: 'Extended streaming history (the richest, can take up to 30 days) or Account data (faster, last year only).',
    files: ['Streaming_History_Audio_*.json', 'StreamingHistory*.json', 'endsong_*.json'],
  },
  {
    platform: 'youtube',
    name: 'YouTube',
    what: 'Google Takeout: YouTube and YouTube Music, history only, in JSON format.',
    files: ['watch-history.json', 'search-history.json'],
  },
  {
    platform: 'netflix',
    name: 'Netflix',
    what: 'Account: Download your personal information.',
    files: ['ViewingActivity.csv'],
  },
] as const;

const FAQ: Array<[string, ReactNode]> = [
  [
    'Is my data uploaded anywhere?',
    'No. Your files are read and analysed inside this browser tab. The only thing that can ever leave your device is a summary card you choose to share, after you’ve seen exactly what it contains.',
  ],
  [
    'Do I need an account?',
    'No. There are no accounts and nothing is saved. Close the tab and your data is gone; add your files again whenever you like.',
  ],
  [
    'Why is YouTube watch time marked “≈”?',
    'YouTube’s export lists when you opened each video, not how long you watched. Life, Wrapped estimates it from the gap to the next video (8 minutes when the gap is over half an hour), and marks every estimate with ≈.',
  ],
  [
    'Is this made by Spotify, YouTube or Netflix?',
    'No. It’s an independent project. Each story is styled to feel like the app it’s about, but uses no logos, artwork or brand fonts.',
  ],
  [
    'What if I only use one of these apps?',
    'You get that app’s story. The combined “online life” story appears once you add at least two.',
  ],
  [
    'Does it work on my phone?',
    'Yes, the stories are made for phones. Exports can be large, so downloading and adding them is often easier on a computer.',
  ],
  [
    'Can I try it without my own data?',
    'Yes. The sample is a made-up year of listening and watching, generated in your browser in a second or two.',
  ],
];

// Links into the app don't prefetch: the player, GSAP and the engine client load
// only once the visitor chooses to start (§15 landing budget).
function CtaLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Link
        href="/story/spotify?sample=1"
        prefetch={false}
        className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-opacity hover:opacity-90"
      >
        Try with sample data <ArrowRight aria-hidden className="size-4" />
      </Link>
      <Link
        href="/start"
        prefetch={false}
        className="border-border hover:bg-secondary rounded-full border px-6 py-3 font-semibold transition-colors"
      >
        Use my own data
      </Link>
    </div>
  );
}

function SectionTitle({
  id,
  eyebrow,
  children,
}: {
  id: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-aurora-cyan text-sm font-semibold tracking-[0.14em] uppercase">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-display mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
      >
        {children}
      </h2>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader>
        <Link className="hover:text-foreground" href="/start" prefetch={false}>
          Use my data
        </Link>
      </SiteHeader>
      <main className="flex-1">
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden px-6 pt-6 pb-20 sm:pt-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 50% 40% at 80% 20%, rgb(124 92 255 / 0.22), transparent), radial-gradient(ellipse 40% 35% at 10% 80%, rgb(34 211 238 / 0.12), transparent)',
            }}
          />
          <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                <ShieldCheck aria-hidden className="text-aurora-lime size-3.5" /> Spotify · YouTube
                · Netflix · processed on your device
              </p>
              <h1
                id="hero-title"
                className="font-display mt-5 text-5xl leading-[1.02] font-bold tracking-tight text-balance sm:text-6xl"
              >
                Your whole online life, wrapped.{' '}
                <span className="text-gradient">Without it ever leaving your device.</span>
              </h1>
              <p className="text-muted-foreground mt-6 max-w-xl text-lg">
                Drop the data exports you can download from Spotify, YouTube and Netflix. Get
                animated stories, each in the style of the app it’s about, made right here in your
                browser.
              </p>
              <CtaLinks className="mt-8" />
              <p className="text-muted-foreground mt-4 text-sm">
                Free · no sign-up · works offline
              </p>
            </div>
            <HeroPreview />
          </div>
        </section>

        <section aria-labelledby="how-title" className="border-border/60 border-t px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <SectionTitle id="how-title" eyebrow="How it works">
              Three steps, all of them on your device
            </SectionTitle>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="bg-card rounded-2xl border p-6">
                  <span className="text-aurora-cyan flex items-center gap-3 text-sm font-semibold">
                    <span className="bg-secondary flex size-9 items-center justify-center rounded-full">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    Step {i + 1}
                  </span>
                  <h3 className="font-display mt-4 text-xl font-bold">{title}</h3>
                  <p className="text-muted-foreground mt-2 leading-relaxed">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="privacy-title" className="border-border/60 border-t px-6 py-20">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center">
            <div>
              <SectionTitle id="privacy-title" eyebrow="The privacy promise">
                Turn off your <span className="whitespace-nowrap">Wi-Fi</span>: it still works.
              </SectionTitle>
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                After your first visit, Life, Wrapped runs entirely on your device. No server ever
                sees your history, so there is nothing to leak, sell or lose.
              </p>
              <Link
                href="/privacy"
                className="text-aurora-cyan mt-6 inline-flex items-center gap-2 font-semibold hover:underline"
              >
                Read exactly how it works, and check it yourself
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ul className="grid gap-3">
              {PROMISES.map(({ icon: Icon, text }) => (
                <li key={text} className="bg-card flex items-start gap-3 rounded-2xl border p-4">
                  <Icon aria-hidden className="text-aurora-lime mt-0.5 size-5 shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
              <li className="bg-card flex items-start gap-3 rounded-2xl border p-4">
                <WifiOff aria-hidden className="text-aurora-lime mt-0.5 size-5 shrink-0" />
                <span>Works offline after the first visit, even with your own files.</span>
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="exports-title" className="border-border/60 border-t px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <SectionTitle id="exports-title" eyebrow="Supported exports">
              Bring what you have
            </SectionTitle>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {EXPORTS.map(({ platform, name, what, files }) => (
                <div key={name} className="bg-card flex flex-col rounded-2xl border p-6">
                  <h3 className="font-display flex items-center gap-2 text-xl font-bold">
                    <span
                      aria-hidden
                      className="size-3 rounded-full"
                      style={{ background: PLATFORM_COLORS[platform] }}
                    />
                    {name}
                  </h3>
                  <p className="text-muted-foreground mt-3 leading-relaxed">{what}</p>
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${name} files we read`}>
                    {files.map((f) => (
                      <li key={f}>
                        <code className="bg-muted rounded-md px-2 py-1 text-xs">{f}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-6">
              Zips, folders and translated file names all work.{' '}
              <Link
                href="/start"
                prefetch={false}
                className="text-aurora-cyan font-semibold hover:underline"
              >
                Step-by-step export guides
              </Link>
            </p>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-border/60 border-t px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <SectionTitle id="faq-title" eyebrow="FAQ">
              Questions, answered
            </SectionTitle>
            <div className="mt-8 max-w-3xl divide-y rounded-2xl border">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      aria-hidden
                      className="text-muted-foreground transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-muted-foreground mt-3 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="cta-title"
          className="border-border/60 border-t px-6 py-20 text-center"
        >
          <h2
            id="cta-title"
            className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            See your year, <span className="text-gradient">without giving it away.</span>
          </h2>
          <CtaLinks className="mt-8 justify-center" />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
