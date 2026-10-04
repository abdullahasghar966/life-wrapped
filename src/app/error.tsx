'use client';
import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

/**
 * Unexpected errors in a page. Nothing is reported anywhere (there is no error
 * service, by design); the details stay in this browser's console.
 */
export default function RouteError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-display text-6xl leading-[0.9] uppercase sm:text-7xl">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mt-4">
          This page hit an unexpected problem. Nothing was sent anywhere; your data is still only in
          this tab. Trying again usually helps.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="bg-ink text-paper hover:bg-ink/85 px-6 py-3 font-semibold"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-ink hover:bg-paper-3 border-[1.5px] px-6 py-3 font-semibold"
          >
            Go home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
