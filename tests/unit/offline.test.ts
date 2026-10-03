import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DECK_ORDER } from '@/story/decks';
import { OFFLINE_ROUTES } from '@/sw/routes';

const APP = path.join(process.cwd(), 'src', 'app');

/** Static, parameterless page routes under src/app (no dynamic segments, no API). */
function staticPages(dir = APP, prefix = ''): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name.startsWith('[') || name === 'api' || name === 'debug' || name === 'serwist')
        continue;
      out.push(...staticPages(full, `${prefix}/${name}`));
    } else if (name === 'page.tsx') {
      out.push(prefix || '/');
    }
  }
  return out;
}

describe('offline routes', () => {
  it('cover every deck', () => {
    for (const deck of DECK_ORDER) expect(OFFLINE_ROUTES).toContain(`/story/${deck}`);
  });

  it('cover every static page of the app', () => {
    expect([...OFFLINE_ROUTES].sort()).toEqual(expect.arrayContaining(staticPages().sort()));
  });
});
