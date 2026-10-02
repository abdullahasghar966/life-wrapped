import { NF_DEVICES_MIN_CLASSES } from '../constants';
import { listOf, pct } from '../copy';
import { define } from '../helpers';
import type { DataCtx, QueryFn } from '../types';
import { nfWhere } from './shared';

export interface NetflixDevices {
  classes: Array<{ device: string; hours: number; share: number }>;
}

async function classes(q: QueryFn, ctx: DataCtx) {
  const [w, p] = nfWhere(ctx);
  return q<NetflixDevices['classes'][number]>(
    `SELECT device_class AS device, ROUND(SUM(duration_s) / 3600.0, 1)::DOUBLE AS hours,
            ROUND(SUM(duration_s) / SUM(SUM(duration_s)) OVER (), 3)::DOUBLE AS share
     FROM netflix_views WHERE ${w} GROUP BY device_class ORDER BY SUM(duration_s) DESC, device`,
    p,
  );
}

export default define<NetflixDevices>({
  id: 'netflix.devices',
  deck: 'netflix',
  order: 8,
  title: 'Where you watch',
  requires: async (q, ctx) => (await classes(q, ctx)).length >= NF_DEVICES_MIN_CLASSES,
  run: async (q, ctx) => ({ classes: await classes(q, ctx) }),
  a11yText: (p) =>
    `Where you watched: ${listOf(p.classes.map((c) => `${c.device} ${pct(c.share)}`))}.`,
});
