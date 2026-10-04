import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export default function SharedCardNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1
          data-testid="share-missing"
          className="font-display text-6xl leading-[0.9] uppercase sm:text-7xl"
        >
          This card isn’t here
        </h1>
        <p className="text-muted-foreground mt-4">
          The person who shared it may have deleted it, or the link is incomplete.
        </p>
        <Link
          href="/start"
          className="bg-ink text-paper hover:bg-ink/85 mt-8 px-6 py-3 font-semibold"
        >
          Make your own
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
