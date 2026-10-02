import { listOf } from '../copy';
import { define } from '../helpers';
import { PLATFORM_LABEL, type Platform } from './shared';

export interface LifeOpener {
  platforms: Platform[];
}

export default define<LifeOpener>({
  id: 'life.opener',
  deck: 'life',
  order: 1,
  title: 'Now, all of it together',
  requires: () => true,
  run: async (_q, ctx) => ({ platforms: [...ctx.availablePlatforms] }),
  a11yText: (p) => `Now, all of it together: ${listOf(p.platforms.map((x) => PLATFORM_LABEL[x]))}.`,
});
