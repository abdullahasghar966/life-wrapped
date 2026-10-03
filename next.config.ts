import { withSerwist } from '@serwist/turbopack';
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Content Security Policy. `connect-src 'self'` is the directive that makes the
 * privacy promise enforceable: the page cannot send data to any other origin.
 * Scripts use 'unsafe-inline' instead of a nonce so pages stay static and work
 * offline; see docs/DECISIONS.md (ADR-007) for the trade-off.
 */
const csp = [
  "default-src 'self'",
  "connect-src 'self'",
  "img-src 'self' data: blob:",
  "worker-src 'self' blob:",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // PGlite (in-memory Postgres for the share E2E tests) loads its own WASM and data
  // files at runtime, so it is required from node_modules rather than bundled.
  serverExternalPackages: ['@electric-sql/pglite'],
  outputFileTracingIncludes: {
    // Read with fs by the OG image routes (root and /s/[id]; route keys match as substrings).
    '/opengraph-image': ['./assets/fonts/*.woff'],
  },
  outputFileTracingExcludes: {
    // Production uses Neon over HTTP; PGlite (~10 MB) never ships in a function.
    '/*': ['./node_modules/@electric-sql/pglite/**/*'],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/duckdb/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

// withSerwist keeps esbuild (used to build the service worker) out of the server bundles.
export default withSerwist(nextConfig);
