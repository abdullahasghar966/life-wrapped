# Session handoff

Read this first, then `MASTER_PROMPT.md` (the spec), `CLAUDE.md` and `AGENTS.md`, `docs/PROGRESS.md`, and `docs/DECISIONS.md` from ADR-030 on.

## 1. Context

Life, Wrapped is complete against the spec and live at <https://life-wrapped-jgpl.vercel.app>. Vercel deploys every push to `main`.

After launch, the owner asked for two changes that go beyond the spec:

- the receipt rebrand (ADR-036), on `main`;
- sharing to social apps (ADR-037), on `claude/focused-cray-sbemly`. It is ready to go live but **not yet on GitHub** (see §5).

## 2. Progress (2026-10-04)

- CI on `main` is green: run 19 for `bcc5972`. The earlier `next/font/google` failure was transient, and the re-run passed. The Plex fonts are still downloaded from Google at build time; see §4 if that error comes back.
- The share-sheet feature was **rebuilt from scratch**. The earlier uncommitted attempt and the first `HANDOFF.md` lived only on the owner's machine and never reached the repo.
- Commits on `claude/focused-cray-sbemly`, on top of `main`:
  - `feat(share)`: the share sheet, the shared card page's Share this card button, and unit and E2E tests;
  - `docs`: ADR-037, plus updates to PRIVACY, README, ARCHITECTURE, PROGRESS and this file;
  - `test(visual)`: new Linux baselines for all 41 cards (§4 explains how they were made);
  - `docs`: this update.
- Checks in the cloud container: `typecheck`, `lint`, `format:check` and `test` (294 + 3) all pass. All 50 Chromium E2E tests pass, visual included.
- One perf budget fails there: "landing → first card in under 5 s" takes about 5.6 s. Old `main` takes the same time in that container, and it passed on GitHub's runners, so it's the container's speed, not this change.

## 3. The owner's requests and the deviations they approved

1. **Receipt rebrand** (ADR-036): this replaces the spec's `aurora` theme.
2. **Share to social apps** (ADR-037). The image goes to Instagram, Snapchat, WhatsApp, Facebook and other apps through the device's share sheet, using the Web Share API with files. There are **no platform logins**. The spec forbids user accounts and platform APIs, and Instagram and Snapchat stories can't be posted from the web anyway. The OS sheet hands the picture to the app where the person is already signed in, and Life, Wrapped sends nothing.
3. **Deploy it** to the live site, which means pushing to `main`.

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

  This reproduced CI's own `main` baselines on all 41 cards. The remaining byte-level differences are ±1 rounding in translucent fills, far below Playwright's threshold. Don't run `playwright install` there; the pinned Playwright's own browser isn't available. The "Visual baselines" workflow (ADR-028) is still the normal route, but its artifacts are served from `*.blob.core.windows.net`, which a cloud session's network policy may block.

- **Headless Chromium has no share sheet.** The E2E tests stub it with `stubShareSheet()` in `tests/e2e/helpers.ts` and check what it received.
- **`navigator.share` needs a fresh user gesture.** That's why the PNG is rendered when the sheet opens and the Share image… button only appears once the image is ready.
- **Playwright skips the `perf` project** when any Chromium spec fails. A perf failure can hide behind another failure.
- **If `next/font/google` fails in CI again:** self-host IBM Plex Sans and Mono like Archivo. Put the WOFF2 files in `src/fonts/` and load them with `next/font/local`.

## 5. Do next

1. **The owner grants GitHub write access** for Claude sessions. Both `git push` and the GitHub API returned `403 Resource not accessible by integration`, which means the Claude GitHub App isn't installed on this repository. Install it at <https://github.com/apps/claude/installations/select_target> and choose `life-wrapped`, or reconnect GitHub at <https://claude.ai/connect-github>.
2. **Push `claude/focused-cray-sbemly`, then fast-forward `main` to it.** Vercel deploys `main` automatically. Confirm CI is green on `main` and that the live site shows the Share button.
3. **Windows visual baselines:** on Windows, run `pnpm build`, then `pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots=all`, look at a few, and commit the `*-win32.png` files. CI doesn't use them.
4. Try the share sheet on a real phone against the live site.
5. Then continue with `docs/PROGRESS.md` → "Next session starts here".
