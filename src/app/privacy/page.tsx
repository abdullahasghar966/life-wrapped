import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How Life, Wrapped keeps your data on your device, what it drops while reading your exports, and how to check it yourself.',
};

const DROPPED = [
  ['Spotify', 'IP addresses, device and browser details, your username, offline timestamps'],
  ['Netflix', 'Bookmarks (where you stopped in each title)'],
  ['YouTube', 'Activity-control settings'],
] as const;

const SHARED = [
  ['Your year in sound', 'minutes, longest streak, top artist, top song, listening style'],
  ['Your year of watching', 'videos, hours, longest rabbit hole, peak hour, top channel'],
  ['Your year on screen', 'hours, binge record, top series, persona'],
  ['Your online life', 'hours, days, share of each platform, personality, most-used platform'],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="font-display text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="text-muted-foreground mt-4 space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-6 pb-20">
        <p className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <ShieldCheck aria-hidden className="text-aurora-lime size-3.5" /> No accounts · no
          analytics · no uploads
        </p>
        <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Your data never leaves your device
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Life, Wrapped turns your Spotify, YouTube and Netflix exports into stories inside this
          browser tab. This page explains exactly what happens to your files and how you can check
          it yourself.
        </p>

        <Section id="flow" title="What happens to your files">
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              You choose files. Your browser hands them to a background worker in this same tab.
            </li>
            <li>
              The worker opens only the files that look like listening or viewing history, keeps the
              few fields the stories need, and drops everything else.
            </li>
            <li>
              The rows go into a small database (DuckDB) that lives in the tab’s memory. Every
              number and chart is a question asked of that database, in your browser.
            </li>
            <li>
              Your data is never written to disk, cookies or browser storage. Close or reload the
              tab and it’s gone; “Clear my data” wipes it at once.
            </li>
          </ol>
          <p>
            There are no analytics, no tracking and no third-party scripts. The fonts and the
            database engine are served from this site.
          </p>
        </Section>

        <Section id="dropped" title="What we drop as soon as we read it">
          <p>
            Exports contain more than a story needs. These fields are discarded the moment a row is
            read, before anything is stored, even in memory:
          </p>
          <dl className="divide-border/60 divide-y rounded-2xl border">
            {DROPPED.map(([platform, fields]) => (
              <div key={platform} className="grid gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr]">
                <dt className="text-foreground font-semibold">{platform}</dt>
                <dd>{fields}</dd>
              </div>
            ))}
          </dl>
          <p>
            Anything a platform adds to its export in future is dropped too, because each reader
            keeps only the fields it knows. Inside a zip, only the history files are even opened;
            account, payment and message files are skipped unread.
          </p>
        </Section>

        <Section id="others" title="Other people on your account">
          <p>
            A Netflix export includes every profile on the account. You pick which one is you, and
            only that profile is ever looked at.
          </p>
          <p>
            Spotify private sessions count towards your totals but stay out of top lists and
            anything shareable, unless you choose otherwise. YouTube searches are left out by
            default, because search history is often more personal than watch history.
          </p>
        </Section>

        <Section id="sharing" title="Sharing a card (optional)">
          <p>
            Sharing is the only time anything is sent to a server, and only when you ask. Only the
            last card of each story can be shared. Before anything is sent, you see the exact text
            that will be uploaded, and nothing leaves until you press “Confirm and share”.
          </p>
          <dl className="divide-border/60 divide-y rounded-2xl border">
            {SHARED.map(([card, fields]) => (
              <div key={card} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
                <dt className="text-foreground font-semibold">{card}</dt>
                <dd>{fields}</dd>
              </div>
            ))}
          </dl>
          <p>
            That, plus whether it came from the sample data, is all a shared card holds; the server
            rejects anything else. It never stores your IP address: the sharing limit (10 an hour)
            counts a salted, scrambled version instead, and entries older than an hour are removed
            whenever a card is shared. You can delete a shared card from the browser you shared it
            from, and its link stops working for everyone.
          </p>
        </Section>

        <Section id="offline" title="It works offline">
          <p>
            After your first visit, your browser keeps a copy of the app, including the database
            engine. Turn off your Wi-Fi and it still works: there is nothing to send, and nowhere it
            could send it.
          </p>
        </Section>

        <Section id="verify" title="Check it yourself">
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              Open your browser’s developer tools (F12, or right-click and Inspect) and choose the
              <strong className="text-foreground"> Network</strong> tab.
            </li>
            <li>Load your files, or the sample, and play every story.</li>
            <li>
              Every request goes to this site: pages, scripts, fonts and the database engine. None
              of them carries your data.
            </li>
            <li>
              In the <strong className="text-foreground">Console</strong> tab, try{' '}
              <code className="bg-muted rounded px-1.5 py-0.5 text-sm">
                fetch(&apos;https://example.com&apos;, {'{'} method: &apos;POST&apos; {'}'})
              </code>
              . The browser refuses: this site’s security policy only lets the page talk to itself.
            </li>
          </ol>
          <p>
            The same checks run automatically on every change to the code, in a test that plays
            every story and fails if a single request goes anywhere else.
          </p>
        </Section>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/start"
            className="bg-primary text-primary-foreground rounded-full px-6 py-3 font-semibold"
          >
            Use my own data
          </Link>
          <Link
            href="/story/spotify?sample=1"
            className="border-border rounded-full border px-6 py-3 font-semibold"
          >
            Try with sample data
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
