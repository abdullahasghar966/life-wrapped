'use client';
import { Check, Copy, Link2, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { buildShareRequest, shareBody } from './schema';
import { saveDeleteToken } from './tokens';

type State =
  | { step: 'checking' }
  | { step: 'disabled' }
  | { step: 'preview' }
  | { step: 'sending' }
  | { step: 'done'; url: string }
  | { step: 'error'; message: string };

/**
 * Opt-in sharing (§13): shows the exact JSON that would leave the device and
 * sends nothing until the user confirms.
 */
export function ShareDialog({
  result,
  isSample,
  onOpenChange,
}: {
  result: InsightResult | null;
  isSample: boolean;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase">Share this card</DialogTitle>
          <DialogDescription>
            A link anyone can open. Only the numbers and names below are sent; your files and
            history stay on this device.
          </DialogDescription>
        </DialogHeader>
        {shown && (
          <ShareFlow
            key={shown.n}
            result={shown.result}
            isSample={isSample}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ShareFlow({
  result,
  isSample,
  onClose,
}: {
  result: InsightResult;
  isSample: boolean;
  onClose: () => void;
}) {
  const request = useMemo(
    () => (result.share ? buildShareRequest(result.share, isSample) : null),
    [result, isSample],
  );
  const body = request ? shareBody(request) : '';
  const [state, setState] = useState<State>({ step: 'checking' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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
  }, []);

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

  const previewing = state.step === 'preview' || state.step === 'sending' || state.step === 'error';

  return (
    <>
      {state.step === 'checking' && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Checking whether sharing is
          available…
        </p>
      )}

      {state.step === 'disabled' && (
        <p role="status" data-testid="share-disabled" className="bg-muted rounded-xl p-4 text-sm">
          Sharing isn’t set up on this deployment (it needs a database). You can still save the card
          as an image.
        </p>
      )}

      {previewing && !request && (
        <p role="status" className="bg-muted rounded-xl p-4 text-sm">
          This card can’t be shared.
        </p>
      )}

      {previewing && request && (
        <div>
          <p className="text-sm font-semibold">This is everything that will be shared:</p>
          <pre
            data-testid="share-preview"
            className="bg-muted mt-2 max-h-72 overflow-auto rounded-xl p-4 text-xs leading-relaxed"
          >
            {body}
          </pre>
          {state.step === 'error' && (
            <p role="alert" className="text-destructive mt-3 text-sm">
              {state.message}
            </p>
          )}
        </div>
      )}

      {state.step === 'done' && (
        <div className="space-y-3">
          <p role="status" className="text-sm font-semibold">
            Your link is ready.
          </p>
          <div className="bg-muted flex items-center gap-2 rounded-xl p-3">
            <Link2 aria-hidden className="text-muted-foreground size-4 shrink-0" />
            <a
              data-testid="share-url"
              href={state.url}
              className="min-w-0 flex-1 truncate text-sm underline"
            >
              {state.url}
            </a>
            <Button size="sm" variant="secondary" onClick={() => copy(state.url)}>
              {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Opening the link in this browser shows a Delete button, so you can take it down any
            time.
          </p>
        </div>
      )}

      <DialogFooter>
        {previewing && request ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={state.step === 'sending'}>
              {state.step === 'sending' && <Loader2 className="animate-spin" aria-hidden />}
              Confirm and share
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
