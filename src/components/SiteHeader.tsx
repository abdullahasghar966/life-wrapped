import Link from 'next/link';

export function BrandMark() {
  return (
    <span className="font-display inline-flex items-center gap-2 text-lg font-bold tracking-tight">
      <span
        aria-hidden
        className="inline-block size-5 rounded-full bg-[conic-gradient(from_200deg,#7c5cff,#22d3ee,#a3e635,#7c5cff)]"
      />
      Life, Wrapped
    </span>
  );
}

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="px-6 py-5">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link href="/" aria-label="Life, Wrapped home">
          <BrandMark />
        </Link>
        <nav aria-label="Main" className="text-muted-foreground flex items-center gap-5 text-sm">
          {children}
          <Link className="hover:text-foreground" href="/privacy" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </div>
    </header>
  );
}
