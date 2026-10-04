'use client';
import { Check, Copy, Download, Link2, Loader2, Share2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { InsightResult } from '@/engine/insights/types';
import { canShareFiles, canShareUrl, cardImageName, openShareSheet } from './nativeShare';
import { buildShareRequest, shareBody } from './schema';
import { saveDeleteToken } from './tokens';

/** The 1080 × 1920 PNG of the card, rendered by the player when the sheet opens. */
export type CardImage =
  { state: 'rendering' } | { state: 'ready'; blob: Blob } | { state: 'error' };

const SHARE_TEXT = 'Made with Life, Wrapped';

/**
 * One place to share a card (ADR-037):
 * - the image, through the device's share sheet, so it can be posted from any
 *   app (nothing is uploaded by Life, Wrapped);
 * - for summary cards, a link, which uploads only the whitelisted numbers and
 *   names, shown as exact JSON first (§13).
 */
export function ShareSheet({
  result,
  isSample,
  image,
  onSaveImage,
  onRetryImage,
  onOpenChange,
}: {
  result: InsightResult | null;
  isSample: boolean;
  image: CardImage;
  onSaveImage: () => void;
  onRetryImage: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!result;
  // Each opening gets a fresh flow; the last card stays mounted while the dialog animates out.
  const [shown, setShown] = useState<{ result: InsightResult; n: number } | null>(null);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (result) setShown({ result, n: (shown?.n ?? 0) + 1 });
  }
  const withLink = !!shown?.result.share;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase">Share this card</DialogTitle>
          <DialogDescription>
            {withLink
              ? 'Post the picture from any app, or make a link anyone can open.'
              : 'Post the picture from any app on your device.'}
          </DialogDescription>
        </DialogHeader>
        {shown && (
          <div key={shown.n} className="grid gap-5">
            <ImageShare
              result={shown.result}
              image={image}
              onSave={onSaveImage}
              onRetry={onRetryImage}
            />
            {withLink && <LinkShare result={shown.result} isSample={isSample} />}
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Points an <img> at a blob for as long as it is shown. */
function useBlobSrc(blob: Blob | null) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (!blob || !img) return;
    const url = URL.createObjectURL(blob);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return ref;
}

function ImageShare({
  result,
  image,
  onSave,
  onRetry,
}: {
  result: InsightResult;
  image: CardImage;
  onSave: () => void;
  onRetry: () => void;
}) {
  const blob = image.state === 'ready' ? image.blob : null;
  const file = useMemo(
    () => (blob ? new File([blob], cardImageName(result.id), { type: 'image/png' }) : null),
    [blob, result.id],
  );
  const imgRef = useBlobSrc(blob);
  const canShare = file ? canShareFiles([file]) : false;
  const [outcome, setOutcome] = useState<'idle' | 'opening' | 'shared' | 'failed'>('idle');

  async function share() {
    if (!file) return;
    setOutcome('opening');
    const r = await openShareSheet({ files: [file], title: result.title, text: SHARE_TEXT });
    setOutcome(r === 'cancelled' ? 'idle' : r);
  }

  return (
    <section aria-labelledby="share-image-heading" className="flex gap-4">
      <div className="bg-muted relative aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-md sm:w-28">
        {blob ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local blob: URL, nothing to optimise
          <img
            ref={imgRef}
            data-testid="share-image-preview"
            alt={`The image you’ll share. ${result.a11y}`}
            className="size-full object-cover"
          />
        ) : (
          image.state === 'rendering' && (
            <Loader2
              aria-hidden
              className="text-muted-foreground absolute inset-0 m-auto size-5 animate-spin"
            />
          )
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <h3 id="share-image-heading" className="font-semibold">
          Share the image
        </h3>
        {image.state === 'rendering' && (
          <p role="status" className="text-muted-foreground">
            Printing your card…
          </p>
        )}
        {image.state === 'error' && (
          <>
            <p role="alert" className="text-destructive">
              The image couldn’t be made.
            </p>
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          </>
        )}
        {image.state === 'ready' && (
          <>
            <p className="text-muted-foreground">
              {canShare
                ? 'Pick Instagram, Snapchat, WhatsApp or any app on your device. The picture goes only to the app you choose; Life, Wrapped uploads nothing.'
                : 'This browser can’t pass pictures to other apps. Save the image, then post it from Instagram, Snapchat or any app you like.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {canShare && (
                <Button onClick={share} disabled={outcome === 'opening'}>
                  <Share2 aria-hidden /> Share image…
                </Button>
              )}
              <Button variant={canShare ? 'secondary' : 'default'} onClick={onSave}>
                <Download aria-hidden /> Save image
              </Button>
            </div>
            {outcome === 'shared' && (
              <p role="status" className="text-muted-foreground text-xs">
                Sent to the app you picked.
              </p>
            )}
            {outcome === 'failed' && (
              <p role="alert" className="text-destructive text-xs">
                The share sheet didn’t open. Save the image and post it from the app instead.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

type LinkState =
  | { step: 'idle' }
  | { step: 'checking' }
  | { step: 'disabled' }
  | { step: 'preview' }
  | { step: 'sending' }
  | { step: 'done'; url: string }
  | { step: 'error'; message: string };

function LinkShare({ result, isSample }: { result: InsightResult; isSample: boolean }) {
  const request = useMemo(
    () => (result.share ? buildShareRequest(result.share, isSample) : null),
    [result, isSample],
  );
  const body = request ? shareBody(request) : '';
  const [state, setState] = useState<LinkState>({ step: 'idle' });
  const [copied, setCopied] = useState(false);
  const [linkShareFailed, setLinkShareFailed] = useState(false);

  useEffect(() => {
    if (state.step !== 'checking') return;
    let cancelled = false;
    fetch('/api/share', { method: 'GET', cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ enabled: boolean }>) : { enabled: false }))
      .catch(() => ({ enabled: false }))
      .then(({ enabled }) => {
        if (!cancelled) setState({ step: enabled ? 'preview' : 'disabled' });
      });
    return () => {
      cancelled = true;
    };
  }, [state.step]);

  async function confirm() {
    if (!request) return;
    setState({ step: 'sending' });
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
      const data = (await res.json()) as { id?: string; deleteToken?: string; message?: string };
      if (!res.ok || !data.id || !data.deleteToken) {
        setState({
          step: 'error',
          message: data.message ?? 'The card couldn’t be shared. Please try again.',
        });
        return;
      }
      saveDeleteToken(data.id, data.deleteToken);
      setState({ step: 'done', url: `${window.location.origin}/s/${data.id}` });
    } catch {
      setState({ step: 'error', message: 'You seem to be offline. Nothing was sent.' });
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      /* the link is visible and selectable anyway */
    }
  }

  async function shareLink(url: string) {
    const r = await openShareSheet({ url, title: result.title, text: SHARE_TEXT });
    setLinkShareFailed(r === 'failed');
  }

  const previewing = state.step === 'preview' || state.step === 'sending' || state.step === 'error';

  return (
    <section aria-labelledby="share-link-heading" className="border-border space-y-3 border-t pt-4">
      <h3 id="share-link-heading" className="font-semibold">
        Or share a link
      </h3>

      {state.step === 'idle' && (
        <>
          <p className="text-muted-foreground">
            A page anyone can open, with this card’s few numbers and names. You see exactly what is
            sent before anything leaves this device.
          </p>
          <Button variant="secondary" onClick={() => setState({ step: 'checking' })}>
            <Link2 aria-hidden /> Create a link…
          </Button>
        </>
      )}

      {state.step === 'checking' && (
        <p className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Checking whether sharing is
          available…
        </p>
      )}

      {state.step === 'disabled' && (
        <p role="status" data-testid="share-disabled" className="bg-muted rounded-xl p-4">
          Sharing links isn’t set up on this deployment (it needs a database). You can still share
          or save the image.
        </p>
      )}

      {previewing && request && (
        <div className="space-y-3">
          <p className="font-semibold">This is everything that will be shared:</p>
          <pre
            data-testid="share-preview"
            className="bg-muted max-h-60 overflow-auto rounded-xl p-4 text-xs leading-relaxed"
          >
            {body}
          </pre>
          {state.step === 'error' && (
            <p role="alert" className="text-destructive">
              {state.message}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setState({ step: 'idle' })}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={state.step === 'sending'}>
              {state.step === 'sending' && <Loader2 className="animate-spin" aria-hidden />}
              Confirm and share
            </Button>
          </div>
        </div>
      )}

      {state.step === 'done' && (
        <div className="space-y-3">
          <p role="status" className="font-semibold">
            Your link is ready.
          </p>
          <div className="bg-muted flex items-center gap-2 rounded-xl p-3">
            <Link2 aria-hidden className="text-muted-foreground size-4 shrink-0" />
            <a
              data-testid="share-url"
              href={state.url}
              className="min-w-0 flex-1 truncate underline"
            >
              {state.url}
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            {canShareUrl(state.url) && (
              <Button onClick={() => shareLink(state.url)}>
                <Share2 aria-hidden /> Share link…
              </Button>
            )}
            <Button variant="secondary" onClick={() => copy(state.url)}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}{' '}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
          {linkShareFailed && (
            <p role="alert" className="text-destructive text-xs">
              The share sheet didn’t open. Copy the link instead.
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            Opening the link in this browser shows a Delete button, so you can take it down any
            time.
          </p>
        </div>
      )}
    </section>
  );
}
