import Link from 'next/link';

export const DISCLAIMER =
  'Life, Wrapped is an independent project and is not affiliated with or endorsed by Spotify, YouTube/Google or Netflix.';

export function SiteFooter() {
  return (
    <footer className="border-ink border-t-[1.5px] px-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-ink-2 max-w-xl text-sm">{DISCLAIMER}</p>
        <nav
          aria-label="Footer"
          className="flex gap-5 font-mono text-xs tracking-[0.08em] uppercase"
        >
          <Link className="hover:text-red-ink" href="/privacy" prefetch={false}>
            Privacy
          </Link>
          <Link className="hover:text-red-ink" href="/start" prefetch={false}>
            Use my data
          </Link>
        </nav>
      </div>
    </footer>
  );
}
