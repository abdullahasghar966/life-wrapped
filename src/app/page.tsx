import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { HeroPreview } from '@/landing/HeroPreview';
import { Receipt } from '@/landing/Receipt';
import { PLATFORM_COLORS } from '@/story/themes';

const STEPS = [
  {
    title: 'Ask for your data',
    body: 'Spotify, YouTube and Netflix each let you download your history. It arrives by email: within minutes from Google Takeout, and within days or a few weeks from the others.',
  },
  {
    title: 'Drop the files here',
    body: 'Zips, folders or single files. Each export is recognised by what’s inside, even if your language renamed it, and read inside this browser tab.',
  },
  {
    title: 'Play your stories',
    body: 'Music, videos, shows, and all of it together, each styled like the app it’s about. Save any card as an image, or share a summary card if you like.',
  },
] as const;

const PROMISES = [
  'No uploads. Your files are read in your browser and never sent anywhere.',
  'No accounts, no analytics, no cookies, no third-party scripts.',
  'IP addresses, device details and other sensitive fields are dropped as files are read.',
  'Nothing is saved. Close the tab and it’s gone.',
  'Works offline after the first visit, even with your own files.',
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
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${className}`}>
      <Link
        href="/story/spotify?sample=1"
        prefetch={false}
        className="bg-ink text-paper hover:bg-ink/85 inline-flex items-center gap-2 px-6 py-3.5 font-semibold transition-colors"
      >
        Try with sample data <ArrowRight aria-hidden className="size-4" />
      </Link>
      <Link
        href="/start"
        prefetch={false}
        className="hover:decoration-red py-2 font-semibold underline decoration-2 underline-offset-[6px] transition-colors"
      >
        Use my own data
      </Link>
    </div>
  );
}

const SECTION = 'border-ink border-t-[1.5px] px-5 py-16 sm:px-8 sm:py-20';
const H2 = 'font-display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.88] uppercase';

export default function Home() {
  return (
    <>
      <SiteHeader>
        <Link className="hover:text-red-ink" href="/start" prefetch={false}>
          Use my data
        </Link>
      </SiteHeader>
      <main className="flex-1">
        <section
          aria-labelledby="hero-title"
          className="overflow-hidden px-5 pt-8 pb-16 sm:px-8 sm:pt-12"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-x-10 gap-y-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-ink-2 font-mono text-xs tracking-[0.1em] uppercase">
                Spotify · YouTube · Netflix — read on your device
              </p>
              <h1 id="hero-title" className="mt-5">
                <span className="font-display block text-[clamp(3.4rem,9vw,7rem)] leading-[0.86] uppercase">
                  Your whole online life, wrapped.
                </span>
                <span className="mt-5 block text-xl font-medium sm:text-2xl">
                  Without it ever <mark className="bg-red text-ink px-1">leaving your device</mark>.
                </span>
              </h1>
              <p className="text-ink-2 mt-5 max-w-lg text-lg">
                Drop the data exports you can download from Spotify, YouTube and Netflix and get
                animated stories, each in the style of the app it’s about. They’re made right here
                in your browser, and nothing is uploaded.
              </p>
              <CtaLinks className="mt-8" />
              <p className="text-ink-2 mt-6 font-mono text-xs tracking-[0.08em] uppercase">
                Free · no sign-up · works offline
              </p>
            </div>
            <div className="relative mx-auto flex w-full max-w-md flex-col items-center sm:flex-row sm:items-start sm:justify-center">
              <HeroPreview frameClassName="-rotate-3" />
              <Receipt className="relative z-10 -mt-6 rotate-2 sm:mt-16 sm:-ml-14" />
            </div>
          </div>
        </section>

        <section aria-labelledby="how-title" className={SECTION}>
          <div className="mx-auto max-w-6xl">
            <h2 id="how-title" className={H2}>
              How it works
            </h2>
            <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map(({ title, body }, i) => (
                <li key={title} className="border-ink border-t-[1.5px] pt-4">
                  <span aria-hidden className="font-display text-red text-6xl leading-none">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {title}
                  </h3>
                  <p className="text-ink-2 mt-2 leading-relaxed">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="privacy-title"
          className="bg-ink text-paper px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div>
              <p className="text-paper/70 font-mono text-xs tracking-[0.1em] uppercase">
                The privacy promise
              </p>
              <h2 id="privacy-title" className={`${H2} mt-3`}>
                Turn off your <span className="whitespace-nowrap">Wi-Fi</span>. It still works.
              </h2>
              <p className="text-paper/80 mt-5 max-w-lg text-lg leading-relaxed">
                After your first visit, Life, Wrapped runs entirely on your device. No server ever
                sees your history, so there is nothing to leak, sell or lose.
              </p>
              <Link
                href="/privacy"
                prefetch={false}
                className="decoration-red mt-6 inline-flex items-center gap-2 font-semibold underline decoration-2 underline-offset-[6px]"
              >
                How it works, and how to check it yourself
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ul className="divide-paper/20 border-paper/20 divide-y border-y font-mono text-sm">
              {PROMISES.map((text) => (
                <li key={text} className="flex gap-3 py-3">
                  <span aria-hidden className="bg-red mt-1.5 size-2 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="exports-title" className={SECTION}>
          <div className="mx-auto max-w-6xl">
            <h2 id="exports-title" className={H2}>
              Bring what you have
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {EXPORTS.map(({ platform, name, what, files }) => (
                <div key={name} className="bg-paper-2 border-ink flex flex-col border-[1.5px] p-5">
                  <h3 className="font-display flex items-center gap-2.5 text-3xl uppercase">
                    <span
                      aria-hidden
                      className="size-3 rounded-full"
                      style={{ background: PLATFORM_COLORS[platform] }}
                    />
                    {name}
                  </h3>
                  <p className="text-ink-2 mt-3 leading-relaxed">{what}</p>
                  <ul
                    className="border-ink/40 mt-auto space-y-1 border-t border-dashed pt-3 font-mono text-xs"
                    aria-label={`${name} files we read`}
                  >
                    {files.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-ink-2 mt-6">
              Zips, folders and translated file names all work.{' '}
              <Link
                href="/start"
                prefetch={false}
                className="text-ink font-semibold underline decoration-2 underline-offset-4"
              >
                Step-by-step export guides
              </Link>
            </p>
          </div>
        </section>

        <section aria-labelledby="faq-title" className={SECTION}>
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <h2 id="faq-title" className={H2}>
              Questions
            </h2>
            <div className="border-ink divide-ink/20 divide-y border-y-[1.5px]">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      aria-hidden
                      className="font-mono text-xl transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-ink-2 mt-3 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="cta-title"
          className="bg-red text-ink px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h2 id="cta-title" className={`${H2} max-w-2xl`}>
              See your year. Keep it to yourself.
            </h2>
            <CtaLinks />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
