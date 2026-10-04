'use client';
import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';
import { canShareUrl, openShareSheet } from './nativeShare';

/**
 * Passes a shared card's link to the device's share sheet, or copies it where
 * there is none (most desktop browsers).
 */
export function ShareLinkButton({ title }: { title: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function share() {
    const url = window.location.href;
    if (canShareUrl(url)) {
      const r = await openShareSheet({ url, title, text: 'Made with Life, Wrapped' });
      if (r !== 'failed') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      setState('failed');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={share}
        className="border-ink hover:bg-paper-3 inline-flex items-center gap-2 border-[1.5px] px-6 py-3 font-semibold"
      >
        {state === 'copied' ? (
          <Check aria-hidden className="size-4" />
        ) : (
          <Share2 aria-hidden className="size-4" />
        )}
        {state === 'copied' ? 'Link copied' : 'Share this card'}
      </button>
      <span role="status" className="sr-only">
        {state === 'copied' ? 'The link is copied.' : ''}
      </span>
      {state === 'failed' && (
        <p role="alert" className="text-muted-foreground w-full text-sm">
          Copy the link from your browser’s address bar to share it.
        </p>
      )}
    </>
  );
}
