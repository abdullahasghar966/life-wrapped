/**
 * Pages that work offline. Each is precached as HTML for page loads, and its RSC
 * payload is saved at install for client-side navigation between them.
 */
export const OFFLINE_ROUTES = [
  '/',
  '/start',
  '/privacy',
  '/offline',
  '/story/spotify',
  '/story/youtube',
  '/story/netflix',
  '/story/life',
] as const;

/** Where the service worker keeps the RSC payloads of OFFLINE_ROUTES. */
export const RSC_CACHE = 'life-wrapped-rsc';
