# Life, Wrapped

[![CI](https://github.com/abdullahasghar966/life-wrapped/actions/workflows/ci.yml/badge.svg)](https://github.com/abdullahasghar966/life-wrapped/actions/workflows/ci.yml)

**Your Spotify, YouTube and Netflix data exports, turned into animated story decks — without your data ever leaving your device.**

> Demo GIF coming in M6.

- **Live:** _not deployed yet_ · **Try it instantly:** `/story/spotify?sample=1`

## Local setup

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. `pnpm install` copies the self-hosted DuckDB-WASM bundle into `public/duckdb/`.

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test   # unit
pnpm build && pnpm e2e                     # Playwright against the production build
```

## Deploy to Vercel

1. Push this repo to GitHub and import it at <https://vercel.com/new>. The framework preset (Next.js) and `pnpm` are detected automatically.
2. Optional, for share links: create a Neon Postgres database (Vercel → Storage → Neon) so `DATABASE_URL` is set, add a random `SHARE_SALT`, and run `pnpm db:migrate` once against it.
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL (used for Open Graph links).
4. Deploy. Without `DATABASE_URL` everything except share links works.

---

_Life, Wrapped is an independent project and is not affiliated with or endorsed by Spotify, YouTube/Google or Netflix._
