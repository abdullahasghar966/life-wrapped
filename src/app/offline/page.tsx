import { WifiOff } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'You’re offline',
  robots: { index: false },
};

/** Shown by the service worker for pages that need the network, such as shared cards. */
export default function OfflinePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <WifiOff aria-hidden className="text-muted-foreground size-10" />
        <h1 className="font-display mt-6 text-6xl leading-[0.9] uppercase sm:text-7xl">
          You’re offline
        </h1>
        <p className="text-muted-foreground mt-4">
          This page needs a connection. Your own stories don’t: Life, Wrapped runs entirely in your
          browser, so you can still add your files and play them.
        </p>
        <Link
          href="/start"
          className="bg-ink text-paper hover:bg-ink/85 mt-8 px-6 py-3 font-semibold"
        >
          Go to my data
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
