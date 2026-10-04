import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p aria-hidden className="font-display text-red text-[9rem] leading-none">
          404
        </p>
        <h1 className="font-display mt-4 text-6xl leading-[0.9] uppercase sm:text-7xl">
          There’s nothing here
        </h1>
        <p className="text-muted-foreground mt-4">
          The link may be mistyped, or the page has moved. Your stories are a click away.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="bg-ink text-paper hover:bg-ink/85 px-6 py-3 font-semibold">
            Go home
          </Link>
          <Link
            href="/start"
            prefetch={false}
            className="border-ink hover:bg-paper-3 border-[1.5px] px-6 py-3 font-semibold"
          >
            Use my data
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
