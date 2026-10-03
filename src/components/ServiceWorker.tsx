'use client';
import { useEffect } from 'react';

/**
 * Registers the offline service worker in production. It waits until the page
 * has loaded and the browser is idle, so precaching (DuckDB is large) never
 * competes with the first paint.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/serwist/sw.js', { scope: '/' }).catch(() => {
        // No offline support (e.g. private mode); everything else still works.
      });
    };
    const whenIdle = () =>
      'requestIdleCallback' in window ? requestIdleCallback(register) : setTimeout(register, 1);
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
  }, []);
  return null;
}
