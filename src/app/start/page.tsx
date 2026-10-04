import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { ExportGuides } from '@/components/start/ExportGuides';
import { StartClient } from './StartClient';

export const metadata: Metadata = {
  title: 'Add your data',
  description:
    'Drop your Spotify, YouTube and Netflix exports. Everything is processed on your device.',
};

export default function StartPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-6 pb-16">
        <p className="text-ink-2 font-mono text-xs tracking-[0.1em] uppercase">
          Processed on this device · nothing is uploaded
        </p>
        <h1 className="font-display mt-4 text-6xl leading-[0.88] uppercase sm:text-7xl">
          Bring your data
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Drop the exports you downloaded from Spotify, YouTube (Google Takeout) or Netflix. We
          recognise each file by its contents, even if it has a different name in your language.
        </p>
        <div className="mt-8">
          <Suspense>
            <StartClient />
          </Suspense>
        </div>
        <ExportGuides />
      </main>
      <SiteFooter />
    </>
  );
}
