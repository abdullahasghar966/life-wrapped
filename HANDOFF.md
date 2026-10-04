# Session handoff

Read this first, then `MASTER_PROMPT.md` (the spec), `CLAUDE.md` and `AGENTS.md`, `docs/PROGRESS.md`, and `docs/DECISIONS.md` from ADR-030 on.

## 1. Context

Life, Wrapped is complete against the spec and live at <https://life-wrapped-jgpl.vercel.app>. After launch, the owner asked for two changes that go beyond the spec:

- the receipt rebrand (ADR-036), on `main`;
- sharing to social apps (ADR-037), on `claude/focused-cray-sbemly`.

## 2. Progress this session (2026-10-04)

- CI on `main` is green: run 19 for `bcc5972`. The earlier `next/font/google` failure was transient, and the re-run passed. The Plex fonts are still downloaded from Google at build time; see §4 if that error comes back.
- The share-sheet feature was **rebuilt from scratch**. The earlier uncommitted attempt and the first `HANDOFF.md` lived only on the owner's machine and never reached the repo.
- Commits on `claude/focused-cray-sbemly`:
  - `feat(share)`: the share sheet, the shared page's Share this card button, and unit and E2E tests;
  - `docs`: ADR-037, plus updates to PRIVACY, README, ARCHITECTURE, PROGRESS and this file.
- Checks run in the cloud container: `typecheck`, `lint`, `format:check` and `test` (294 + 3) all pass. `pnpm e2e` passes 46 of 50. The 4 failures are `visual.spec.ts`, as expected, because every card gained a Share pill.

## 3. The owner's requests and the deviations they approved

1. **Receipt rebrand** (ADR-036): this replaces the spec's `aurora` theme.
2. **Share to social apps** (ADR-037). The image goes to Instagram, Snapchat, WhatsApp, Facebook and other apps through the device's share sheet, using the Web Share API with files. There are **no platform logins**. The spec forbids user accounts and platform APIs, and Instagram and Snapchat stories can't be posted from the web anyway. The OS sheet hands the picture to the app where the person is already signed in, and Life, Wrapped sends nothing.

## 4. Gotchas

- **Visual baselines are per OS.** Linux baselines must come from the "Visual baselines" workflow (ubuntu-latest). A cloud container's Chromium renders fonts differently, so its screenshots don't match CI.
- **Playwright in the cloud container:** the pinned Playwright wants a newer browser build than the one in `/opt/pw-browsers`. Use a local config that sets `launchOptions.executablePath: '/opt/pw-browsers/chromium'`. It is untracked and excluded through `.git/info/exclude`.
- **Headless Chromium has no share sheet.** The E2E tests stub it with `stubShareSheet()` in `tests/e2e/helpers.ts` and check what it received.
- **`navigator.share` needs a fresh user gesture.** That's why the PNG is rendered when the sheet opens and the Share image… button only appears once the image is ready.
- **If `next/font/google` fails in CI again:** self-host IBM Plex Sans and Mono like Archivo. Put the WOFF2 files in `src/fonts/` and load them with `next/font/local`. Delete any line in this file that no longer applies.

## 5. Do next

1. **Fix GitHub access for the Claude sessions.** This session could not push (403) or start workflows. Then push `claude/focused-cray-sbemly`.
2. **Linux baselines:** run the "Visual baselines" workflow on the branch, download the `visual-baselines-linux` artifact, and commit the PNGs into `tests/e2e/visual.spec.ts-snapshots/`.
3. **Windows baselines:** run `pnpm build`, then `pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots=all`, and commit the `*-win32.png` files. Look at a few of them before committing.
4. **Open a PR to `main`,** confirm CI is green, merge, and check the share sheet on a phone against the live site.
5. Then continue with `docs/PROGRESS.md` → "Next session starts here".
