import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-display max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Your whole online life, wrapped.{' '}
          <span className="text-gradient">Without it ever leaving your device.</span>
        </h1>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/story/spotify?sample=1"
            className="bg-primary text-primary-foreground rounded-full px-6 py-3 font-semibold"
          >
            Try with sample data
          </Link>
          <Link href="/start" className="border-border rounded-full border px-6 py-3 font-semibold">
            Use my own data
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
