'use client';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { forgetDeleteToken, getDeleteToken } from './tokens';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

/** Shown only in the browser that made the share, which holds its delete token. */
export function DeleteShare({ id }: { id: string }) {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribe,
    () => getDeleteToken(id),
    () => null,
  );
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting' | 'error'>('idle');

  if (!token) return null;

  async function remove() {
    setStep('deleting');
    try {
      const res = await fetch(`/api/share/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.status === 204 || res.status === 404) {
        forgetDeleteToken(id);
        router.refresh();
        return;
      }
      setStep('error');
    } catch {
      setStep('error');
    }
  }

  return (
    <div className="border-border/60 mt-8 rounded-2xl border p-4 text-sm">
      <p className="font-semibold">You shared this card from this browser.</p>
      {step === 'idle' ? (
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => setStep('confirm')}>
          <Trash2 aria-hidden /> Delete this card
        </Button>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-muted-foreground">
            The link will stop working for everyone. This can’t be undone.
          </p>
          {step === 'error' && (
            <p role="alert" className="text-destructive">
              The card couldn’t be deleted. Please try again.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={remove} disabled={step === 'deleting'}>
              {step === 'deleting' && <Loader2 className="animate-spin" aria-hidden />}
              Delete it
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStep('idle')}>
              Keep it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
