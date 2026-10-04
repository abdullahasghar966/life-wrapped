# Session handoff

Read this first, then `MASTER_PROMPT.md` (the spec), `CLAUDE.md` and `AGENTS.md`, `docs/PROGRESS.md`, and `docs/DECISIONS.md` from ADR-030 on.

## 1. Context

Life, Wrapped is complete against the spec and live at <https://life-wrapped-jgpl.vercel.app>. Vercel deploys every push to `main`.

After launch, the owner asked for changes beyond the spec. Each has an ADR:

- the receipt rebrand (ADR-036), on `main`;
- merged into `main` through pull request #1 and deployed (2026-10-04):
  - share to social apps (ADR-037);
  - one brand around every story (ADR-038);
  - 3D motion (ADR-039);
  - a top song or video alongside the stories (ADR-040).

## 2. Progress (2026-10-04)

- CI on `main` is green after the merge: run 21 for `34a94d6`, with all 55 E2E tests and landing → story at 4.1 s against the 5 s budget. Vercel deployed the merged code.
- Everything in §1 is built, tested and committed on the branch, together with Linux visual baselines and docs: the ADRs, PRIVACY, README, ARCHITECTURE and PROGRESS. The landing page and /privacy now describe the optional players honestly.
- Checks in the cloud container:
  - `typecheck`, `lint`, `format:check` and `test` (298 + 3) all pass.
  - All 53 Chromium E2E tests pass: visual, accessibility, privacy, offline, sharing and media.
  - Only the perf budget "landing → first card in 5 s" fails there, at about 5.7 s. Old `main` takes 5.65 s in that container and 4.1 s on GitHub's runners, so it's the container's speed. The new work adds about 1.5%.

## 3. The owner's requests and the deviations they approved

1. **Receipt rebrand** (ADR-036): this replaces the spec's `aurora` theme.
2. **Share to social apps** (ADR-037). Cards go out as images through the device's share sheet, with no platform logins.
3. **Consistent theme** (ADR-038). The landing page's look stays around the stories from start to end; only the stories look like the platforms.
4. **3D animations** (ADR-039). These are CSS 3D with GSAP, not WebGL, so text stays in the DOM and saved images still work.
5. **Play top songs and videos** (ADR-040). This is an exception to §3, accepted by the owner: the platforms' players are framed and show their logos and artwork. Mitigations:
   - own data only;
   - nothing loads until a pick;
   - checked ids;
   - `frame-src` allows exactly two origins, and `connect-src 'self'` is unchanged;
   - sandboxed frames;
   - honest copy everywhere.
6. **Deploy it** to the live site, which means pushing to `main`.

## 4. Gotchas

- **Linux visual baselines can be made in a cloud container,** but only with Chromium's **headless shell**. The full browser renders text 3–4% differently from CI. Use an untracked Playwright config, listed in `.git/info/exclude`:

  ```ts
  import base from './playwright.config';
  import { defineConfig } from '@playwright/test';
  export default defineConfig({
    ...base,
    use: {
      ...base.use,
      launchOptions: {
        executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
      },
    },
  });
  ```

  This reproduced CI's own `main` baselines on all 41 cards. The remaining byte-level differences are ±1 rounding, far below Playwright's threshold. Don't run `playwright install` there.

- **Workflow artifacts can't be downloaded** from a cloud session: `*.blob.core.windows.net` is blocked by its network policy.
- **`next dev` runs effects twice (Strict Mode).** The story page's sample loading can then race and bounce to /start. Review story pages on a production build (`pnpm build && pnpm start`).
- **Axe and the Spotify wipe blob.** The colour-wipe blob is 300% of the frame and clipped by it. Axe still treats it as being behind text outside the frame. Text around the frame needs an explicit background (the keyboard hints and the story list have one).
- **Tests stub the media players.** `tests/e2e/media.spec.ts` routes both origins to a stub page, and `tests/e2e/exports.ts` generates real-format exports big enough to unlock decks. The offline test uses them too.
- **Playwright skips the `perf` project** when any Chromium spec fails, so a perf failure can hide behind another failure.
- **If `next/font/google` fails in CI again:** self-host IBM Plex Sans and Mono like Archivo. Put the WOFF2 files in `src/fonts/` and load them with `next/font/local`.

## 5. Do next

1. **On the live site, with a real export:** check that the soundtrack picker plays in Spotify's and YouTube's players (tests stub them), the cube between decks, and the share sheet on a phone.
2. **Windows visual baselines:** on Windows, run `pnpm build`, then `pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots=all`, look at a few, and commit the `*-win32.png` files. CI doesn't use them.
3. Then continue with `docs/PROGRESS.md` → "Next session starts here".
