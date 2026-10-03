import Link from 'next/link';

export const DISCLAIMER =
  'Life, Wrapped is an independent project and is not affiliated with or endorsed by Spotify, YouTube/Google or Netflix.';

export function SiteFooter() {
  return (
    <footer className="border-border/60 text-muted-foreground border-t px-6 py-10 text-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl">{DISCLAIMER}</p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link className="hover:text-foreground" href="/privacy" prefetch={false}>
            Privacy
          </Link>
          <Link className="hover:text-foreground" href="/start" prefetch={false}>
            Use my data
          </Link>
        </nav>
      </div>
    </footer>
  );
}
