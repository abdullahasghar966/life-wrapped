import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getDb } from '@/server/db';
import { getShare } from '@/server/shares';
import { SHARE_TITLES, toInsightResult } from '@/share/cards';
import { DeleteShare } from '@/share/DeleteShare';
import type { ShareCardType } from '@/share/schema';
import { SharedCard } from '@/share/SharedCard';
import { ShareLinkButton } from '@/share/ShareLinkButton';

const HEADINGS: Record<ShareCardType, string> = {
  'spotify.summary': 'Someone’s year in sound',
  'youtube.summary': 'Someone’s year of watching',
  'netflix.summary': 'Someone’s year on screen',
  'life.summary': 'Someone’s online life, wrapped',
};

const DESCRIPTION =
  'A card made with Life, Wrapped. Turn your own Spotify, YouTube and Netflix exports into a story, right in your browser.';

// Request-time only: a deleted card must disappear at once, so nothing is cached.
const loadShare = cache(async (id: string) => {
  await connection();
  const db = await getDb();
  return db ? getShare(db, id) : null;
});

export async function generateMetadata({ params }: PageProps<'/s/[id]'>): Promise<Metadata> {
  const share = await loadShare((await params).id);
  const title = share ? SHARE_TITLES[share.payload.cardType] : 'Card not found';
  return {
    title,
    description: DESCRIPTION,
    robots: { index: false, follow: false },
    openGraph: { title: `${title} · Life, Wrapped`, description: DESCRIPTION, type: 'website' },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function SharedCardPage({ params }: PageProps<'/s/[id]'>) {
  const share = await loadShare((await params).id);
  if (!share) notFound();
  const { payload } = share;
  const deck = payload.cardType.split('.')[0];
  const sharedOn = new Date(share.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 pt-2 pb-16 sm:px-6 md:grid-cols-[minmax(0,24rem)_1fr] md:gap-16">
        <div className="mx-auto w-full max-w-[24rem]">
          <SharedCard
            cardType={payload.cardType}
            theme={payload.theme}
            result={toInsightResult(payload)}
          />
        </div>
        <section aria-labelledby="share-heading" className="text-center md:text-left">
          {share.isSample && (
            <p
              data-testid="sample-badge"
              className="bg-red text-ink mb-4 inline-flex px-2 py-1 font-mono text-xs tracking-[0.04em] uppercase"
            >
              Sample data · made with the built-in demo, not a real person’s history
            </p>
          )}
          <h1
            id="share-heading"
            className="font-display text-6xl leading-[0.9] text-balance uppercase sm:text-7xl"
          >
            {HEADINGS[payload.cardType]}
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md md:mx-0">
            Made with Life, Wrapped, which turns Spotify, YouTube and Netflix data exports into an
            animated story. It runs entirely in your browser: your files never leave your device.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link
              href="/start"
              className="bg-ink text-paper hover:bg-ink/85 px-6 py-3 font-semibold"
            >
              Make your own
            </Link>
            <Link
              href={`/story/${deck}?sample=1`}
              className="border-ink hover:bg-paper-3 border-[1.5px] px-6 py-3 font-semibold"
            >
              Try it with sample data
            </Link>
            <ShareLinkButton title={SHARE_TITLES[payload.cardType]} />
          </div>
          <p className="text-muted-foreground mt-6 inline-flex items-center gap-2 text-xs">
            <ShieldCheck aria-hidden className="size-3.5 shrink-0" />
            Shared on {sharedOn}. Only the numbers and names on this card were shared.
          </p>
          <DeleteShare id={share.id} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
