/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig } from 'serwist';
import { OFFLINE_ROUTES, RSC_CACHE } from './routes';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const isPrefetch = (r: Request) =>
  r.headers.has('Next-Router-Prefetch') || r.headers.has('Next-Router-Segment-Prefetch');

/**
 * The offline service worker (§14). Everything the app needs is precached for
 * this build: pages, scripts, fonts and the DuckDB engine. It never caches API
 * responses or anything from another origin, and it sends nothing anywhere.
 */
const serwist: Serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    // Precache downloads skip the HTTP cache. Otherwise a page loading DuckDB's
    // 36 MB WASM while the worker installs shares one HTTP-cache entry with it,
    // and Chrome can fail one of them (ERR_CACHE_WRITE_FAILURE).
    fetchOptions: { cache: 'no-store' },
    plugins: [
      {
        // Turbopack hands a worker its bootstrap config in the script URL's
        // fragment. A cached response carries the cached URL (no fragment); a
        // fresh response takes the request's URL, fragment included.
        handlerWillRespond: async ({ request, response }) =>
          request.destination === 'worker'
            ? new Response(await response.blob(), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
              })
            : response,
      },
    ],
  },
  skipWaiting: true,
  clientsClaim: true,
  disableDevLogs: true,
  runtimeCaching: [
    {
      // Page loads. The app's own pages come from this build's precache: their
      // query (?sample=1) only matters in the browser. Other pages (shared cards)
      // come from the network, or the offline page.
      matcher: ({ request, sameOrigin }) => sameOrigin && request.mode === 'navigate',
      handler: async ({ request, url }): Promise<Response> => {
        const page = await serwist.matchPrecache(url.pathname);
        if (page) return page;
        try {
          return await fetch(request);
        } catch {
          return (await serwist.matchPrecache('/offline')) ?? Response.error();
        }
      },
    },
    {
      // Client-side navigation. Next.js turns a failed payload request into a full
      // page load, which would lose the data held in the tab, so offline the copy
      // saved at install answers instead.
      matcher: ({ request, sameOrigin }) =>
        sameOrigin && request.headers.get('RSC') === '1' && !isPrefetch(request),
      handler: async ({ request, url }): Promise<Response> => {
        try {
          return await fetch(request);
        } catch (error) {
          const cache = await caches.open(RSC_CACHE);
          const saved = await cache.match(url.pathname, { ignoreSearch: true, ignoreVary: true });
          if (saved) return saved;
          throw error;
        }
      },
    },
  ],
});

async function saveRscPayloads(): Promise<void> {
  const cache = await caches.open(RSC_CACHE);
  await Promise.all(
    OFFLINE_ROUTES.map(async (path) => {
      try {
        const res = await fetch(path, { headers: { RSC: '1' }, cache: 'no-store' });
        if (res.ok && res.headers.get('content-type')?.startsWith('text/x-component')) {
          // A fresh copy drops the cache-busting redirect Next.js answers with: served
          // as-is, Next.js would adopt the redirect's URL and lose the page's query.
          const copy = new Response(await res.arrayBuffer(), { headers: res.headers });
          await cache.put(path, copy);
        }
      } catch {
        // Offline while installing: the precache fails too and the install is retried.
      }
    }),
  );
}

self.addEventListener('install', (event) => event.waitUntil(saveRscPayloads()));

serwist.addEventListeners();
