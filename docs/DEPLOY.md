# Deploying Life, Wrapped

The app is a Next.js 16 project with static pages, one optional server feature (share links) and a service worker. Vercel needs no configuration beyond environment variables.

## Vercel

1. Import the repository at <https://vercel.com/new>, or use the **Deploy with Vercel** button in the README. The framework (Next.js) and package manager (pnpm) are detected; use Node.js 22.
2. Keep the default build command, `pnpm build`. It copies the self-hosted DuckDB-WASM bundle into `public/duckdb/` before `next build`.
3. Set environment variables (all optional):

   | Variable               | Purpose                                                                                                                           |
   | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL` | Absolute URL for link previews. Defaults to the Vercel production domain.                                                         |
   | `DATABASE_URL`         | Neon Postgres connection string. Enables share links.                                                                             |
   | `SHARE_SALT`           | Random secret used to hash IP addresses for the share rate limit. Generate one with `node -e "console.log(crypto.randomUUID())"`. |

   Sharing turns on only when both `DATABASE_URL` and `SHARE_SALT` are set. Without them everything else works, and the Share button explains that sharing isn't set up.

4. Only if you enabled sharing: create the database (Vercel → Storage → Neon, or <https://neon.tech>) and apply the migration once from your machine:

   ```bash
   DATABASE_URL="postgres://…" pnpm db:migrate
   ```

5. Deploy.

## Checklist after deploying

- [ ] `/` loads, and **Try with sample data** opens the Spotify story (one click). `/story/spotify?sample=1` works as a direct link.
- [ ] The response headers of `/` include `Content-Security-Policy` with `connect-src 'self'` (DevTools → Network → the document → Headers).
- [ ] While playing the sample, DevTools → Network shows requests to your domain only, and none with a payload.
- [ ] Offline:
  - Load the site and wait a few seconds while the service worker installs (Application → Service workers shows it activated).
  - Go offline, then load `/start` and play the sample.
  - Add a real export and play it.
- [ ] `/serwist/sw.js` is served as JavaScript with `Service-Worker-Allowed: /`.
- [ ] `/debug` returns 404. It exists only in development and in the E2E server (`ENABLE_DEBUG_PAGE=1`).
- [ ] Sharing, if configured:
  - Share a summary card.
  - Open the link in a private window and check the preview image at `/s/<id>/opengraph-image`.
  - Delete the card from the browser that shared it; the link should now show "This card isn't here".
- [ ] Lighthouse: `pnpm lighthouse https://<your-domain>/`. Expect around 96 / 100 / 100 / 100 on mobile.
- [x] Put the live URL in the README.

## Other hosts

Any Node.js host that can run `pnpm build && pnpm start` works. Keep in mind:

- The share rate limit reads the client address from `x-forwarded-for` (first entry) or `x-real-ip`. Your proxy must set or overwrite these headers, or the limit can be dodged (ADR-032).
- `public/duckdb/*` is served with a one-year immutable cache header (see `next.config.ts`); the files are versioned by the package.
- `DATABASE_URL=pglite://memory` runs an in-memory Postgres for tests. It loses everything on restart and isn't shared between instances, so never use it in production.
