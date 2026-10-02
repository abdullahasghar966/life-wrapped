import { describe, expect, it } from 'vitest';
import { coverArt, initials, posterArt, thumbArt } from '@/story/art/generatedArt';

describe('generated art', () => {
  it('is deterministic: the same name always gives the same art', () => {
    expect(coverArt('Nova Vale')).toEqual(coverArt('Nova Vale'));
    expect(thumbArt('Pixel Kitchen')).toEqual(thumbArt('Pixel Kitchen'));
    expect(posterArt('Midnight Harbor')).toEqual(posterArt('Midnight Harbor'));
  });

  it('varies between names', () => {
    const names = [
      'Nova Vale',
      'Static Bloom',
      'Mirela Quist',
      'Kai Okonte',
      'Moth Parade',
      'Fen & Fable',
    ];
    const specs = new Set(names.map((n) => JSON.stringify(coverArt(n))));
    expect(specs.size).toBe(names.length);
  });

  it.each([
    ['Nova Vale', 'NV'],
    ['The Paper Lanterns of Oslo Street', 'PL'],
    ['Juniper & the Hollow Pines', 'JT'],
    ['Lo-Fi Lagoon', 'LF'],
    ['Ferro the Cat', 'FT'],
    ['ünïcode name', 'ÜN'],
    ['!!!', '♪'],
  ])('initials(%s) = %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
