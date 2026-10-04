import Link from 'next/link';
import { BrandMark } from './brand';

export { BrandMark };

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-ink border-b-[1.5px] px-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-4">
        <Link href="/" aria-label="Life, Wrapped home" className="hover:text-red-ink shrink-0">
          <BrandMark />
        </Link>
        <nav
          aria-label="Main"
          className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.06em] whitespace-nowrap uppercase sm:gap-5 sm:text-xs sm:tracking-[0.08em]"
        >
          {children}
          <Link className="hover:text-red-ink" href="/privacy" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </div>
    </header>
  );
}
