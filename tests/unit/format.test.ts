import { describe, expect, it } from 'vitest';
import { isLongName, shorten } from '@/lib/format';

describe('shortening long names for headlines', () => {
  it('leaves short names alone', () => {
    expect(shorten('Harry Pinero', 28)).toBe('Harry Pinero');
    expect(shorten('  Lofi Girl  ', 28)).toBe('Lofi Girl');
  });

  it('cuts at a word boundary and drops trailing punctuation', () => {
    expect(
      shorten('GUESS THE MUSLIM (FT. CHUNKZ, SHARKY & BRAZAVILLE) | Ramadan Special 2025', 40),
    ).toBe('GUESS THE MUSLIM (FT. CHUNKZ, SHARKY &…');
    expect(shorten('Rap Icon Pakistan | Episode 3 | Talha Anjum, Bohemia', 22)).toBe(
      'Rap Icon Pakistan…',
    );
  });

  it('never splits an emoji or goes over the limit', () => {
    const out = shorten('😱🔥😱🔥😱🔥😱🔥😱🔥😱🔥😱🔥😱🔥', 10);
    expect(Array.from(out)).toHaveLength(10);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });

  it('cuts a single long word mid-word rather than not at all', () => {
    expect(shorten('Supercalifragilisticexpialidocious', 12)).toBe('Supercalifr…');
  });

  it('tells long names from short ones', () => {
    expect(isLongName('Hans Zimmer')).toBe(false);
    expect(isLongName('Wolfgang Amadeus Mozart, Berliner Philharmoniker')).toBe(true);
  });
});
