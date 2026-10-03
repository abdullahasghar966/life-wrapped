// Runs Lighthouse (mobile, simulated 4G: its defaults) against a running server.
// Usage: pnpm build && pnpm start, then: node scripts/lighthouse.mjs [url] [runs]
// It starts Playwright's Chromium itself and Lighthouse attaches over the
// debugging port, which also works where Lighthouse can't launch a browser.
import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:3000/';
const runs = Number(process.argv[3] ?? 3);
const PORT = 9333;
const outDir = path.join('.lighthouse');
mkdirSync(outDir, { recursive: true });

/** Playwright's headless shell (some sandboxes can't start the full browser), else Chromium. */
function browserPath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = path.resolve(path.dirname(chromium.executablePath()), '..', '..');
  const dir = readdirSync(root).find((d) => d.startsWith('chromium_headless_shell-'));
  const exe = {
    win32: 'chrome-headless-shell-win64/chrome-headless-shell.exe',
    darwin: 'chrome-headless-shell-mac-arm64/chrome-headless-shell',
    linux: 'chrome-headless-shell-linux64/chrome-headless-shell',
  }[process.platform];
  const shell = dir && exe ? path.join(root, dir, exe) : null;
  return shell && existsSync(shell) ? shell : chromium.executablePath();
}

const chrome = spawn(browserPath(), [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${mkdtempSync(path.join(tmpdir(), 'lw-lighthouse-'))}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
]);
for (let i = 0; i < 50; i++) {
  const up = await fetch(`http://127.0.0.1:${PORT}/json/version`).then(
    (r) => r.ok,
    () => false,
  );
  if (up) break;
  await new Promise((r) => setTimeout(r, 200));
}
const results = [];
try {
  for (let i = 1; i <= runs; i++) {
    const out = path.join(outDir, `run-${i}.json`);
    const r = spawnSync(
      'pnpm',
      [
        'dlx',
        'lighthouse@12',
        url,
        `--port=${PORT}`,
        '--quiet',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--output=json',
        `--output-path=${out}`,
      ],
      { stdio: 'inherit', shell: process.platform === 'win32' },
    );
    if (r.status !== 0) throw new Error(`lighthouse exited with ${r.status}`);
    const report = JSON.parse(readFileSync(out, 'utf8'));
    const score = (k) => Math.round(report.categories[k].score * 100);
    const ms = (id) => Math.round(report.audits[id].numericValue);
    results.push({
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
      fcpMs: ms('first-contentful-paint'),
      lcpMs: ms('largest-contentful-paint'),
      tbtMs: ms('total-blocking-time'),
      cls: report.audits['cumulative-layout-shift'].numericValue.toFixed(3),
    });
  }
} finally {
  chrome.kill();
}
console.table(results);
// The median run by performance score is the one worth quoting.
const median = [...results].sort((a, b) => a.performance - b.performance)[Math.floor(runs / 2)];
console.log('median:', JSON.stringify(median));
