import { createSerwistRoute } from '@serwist/turbopack';
import { randomUUID } from 'node:crypto';
import { OFFLINE_ROUTES } from '@/sw/routes';

// Pages change with every build (their HTML names that build's scripts), so they
// are re-fetched whenever a new version is deployed.
const revision = process.env.VERCEL_GIT_COMMIT_SHA || randomUUID();

/**
 * Builds the service worker (src/sw/sw.ts) at build time and serves it from
 * /serwist/sw.js. The precache holds everything the app needs offline: this
 * build's scripts and styles, the self-hosted fonts, the DuckDB engine and the
 * pages themselves.
 */
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    swSrc: 'src/sw/sw.ts',
    useNativeEsbuild: true,
    // A classic script registers in every browser with service workers.
    esbuildOptions: { format: 'iife' },
    globPatterns: ['.next/static/**/*.{js,css,woff2,png,svg,ico,webp,avif,json}', 'public/**/*'],
    // DuckDB's WASM is about 36 MB; without it nothing works offline.
    maximumFileSizeToCacheInBytes: 48 * 1024 * 1024,
    additionalPrecacheEntries: [
      ...OFFLINE_ROUTES.map((url) => ({ url, revision })),
      // (Icons are already in the precache from public/.)
      { url: '/manifest.webmanifest', revision },
    ],
  },
);
