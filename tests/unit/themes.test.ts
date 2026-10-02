import { describe, expect, it } from 'vitest';
import { AA, contrastRatio } from '@/lib/contrast';
import { THEMES, contrastPairs } from '@/story/themes';

describe('theme contrast (WCAG AA)', () => {
  for (const theme of Object.values(THEMES)) {
    for (const pair of contrastPairs(theme)) {
      it(`${theme.id}: ${pair.label} (${pair.fg} on ${pair.bg}) meets ${pair.kind}`, () => {
        expect(contrastRatio(pair.fg, pair.bg)).toBeGreaterThanOrEqual(AA[pair.kind]);
      });
    }
  }

  it('computes known ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#E50914', '#000000')).toBeLessThan(4.5);
  });
});
