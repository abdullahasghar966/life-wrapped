import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-primary font-medium underline underline-offset-4"
    >
      {children}
    </a>
  );
}

export function ExportGuides({ defaultOpen }: { defaultOpen?: string }) {
  return (
    <section aria-labelledby="guides-title" className="mt-14">
      <h2 id="guides-title" className="font-display text-4xl uppercase">
        How to get your exports
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Each platform emails you a download link. Platform menus change from time to time; if a step
        looks different, look for “Privacy” or “Download your data”.
      </p>
      <Accordion type="single" collapsible defaultValue={defaultOpen} className="mt-4">
        <AccordionItem value="spotify">
          <AccordionTrigger className="text-base">Spotify</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-3 text-sm leading-relaxed">
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Open{' '}
                <Ext href="https://www.spotify.com/account/privacy/">
                  spotify.com/account/privacy
                </Ext>{' '}
                and scroll to <strong>Download your data</strong>.
              </li>
              <li>
                Tick <strong>Extended streaming history</strong>: it&apos;s the richest option
                (every play since you joined) but can take up to 30 days.
              </li>
              <li>
                <strong>Account data</strong> is faster (usually a few days) but only covers the
                last year. You can request both; we never double count.
              </li>
              <li>Drop the zip(s) here when the email arrives.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="youtube">
          <AccordionTrigger className="text-base">YouTube (Google Takeout)</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-3 text-sm leading-relaxed">
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Open <Ext href="https://takeout.google.com">takeout.google.com</Ext> and click{' '}
                <strong>Deselect all</strong>.
              </li>
              <li>
                Tick <strong>YouTube and YouTube Music</strong>, open{' '}
                <strong>All YouTube data included</strong> and choose only <strong>history</strong>.
              </li>
              <li>
                Open <strong>Multiple formats</strong> and set <strong>History</strong> to{' '}
                <strong>JSON</strong>. Takeout&apos;s default is HTML, which we can&apos;t read yet.
              </li>
              <li>Create the export and drop the zip here.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="netflix">
          <AccordionTrigger className="text-base">Netflix</AccordionTrigger>
          <AccordionContent className="text-muted-foreground space-y-3 text-sm leading-relaxed">
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Open{' '}
                <Ext href="https://www.netflix.com/account/getmyinfo">
                  netflix.com/account/getmyinfo
                </Ext>{' '}
                and request your personal information.
              </li>
              <li>
                Drop the zip here. We only read <code>ViewingActivity.csv</code>; the export
                includes every profile, and you choose which one is you.
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
