import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export default function SharedCardNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 data-testid="share-missing" className="font-display text-4xl font-bold tracking-tight">
          This card isn’t here
        </h1>
        <p className="text-muted-foreground mt-4">
          The person who shared it may have deleted it, or the link is incomplete.
        </p>
        <Link
          href="/start"
          className="bg-primary text-primary-foreground mt-8 rounded-full px-6 py-3 font-semibold"
        >
          Make your own
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
