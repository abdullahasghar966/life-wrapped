import { listOf, pct } from '../copy';
import { define } from '../helpers';
import { PLATFORM_LABEL, PLATFORMS, secondsByPlatform, sum, type Platform } from './shared';

export interface LifeSplit {
  platforms: Array<{ platform: Platform; hours: number; share: number }>;
  top: Platform;
}

export default define<LifeSplit>({
  id: 'life.split',
  deck: 'life',
  order: 3,
  title: 'Platform split',
  requires: () => true,
  async run(q, ctx) {
    const s = await secondsByPlatform(q, ctx);
    const total = sum(s);
    if (total <= 0) return null;
    const platforms = PLATFORMS.filter((p) => ctx.availablePlatforms.includes(p))
      .map((platform) => ({
        platform,
        hours: Math.round(s[platform] / 3600),
        share: Math.round((s[platform] / total) * 1000) / 1000,
      }))
      .sort((a, b) => b.share - a.share);
    return { platforms, top: platforms[0]!.platform };
  },
  a11yText: (p) =>
    `How your time split: ${listOf(p.platforms.map((x) => `${PLATFORM_LABEL[x.platform]} ${pct(x.share)}`))}.`,
});
