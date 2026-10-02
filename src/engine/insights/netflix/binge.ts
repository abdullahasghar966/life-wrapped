import { NF_BINGE_MIN_EPISODES } from '../constants';
import { day } from '../copy';
import { define } from '../helpers';
import { bingeRecord, type BingeRecord } from './shared';

export default define<BingeRecord>({
  id: 'netflix.binge',
  deck: 'netflix',
  order: 5,
  title: 'Binge record',
  requires: async (q, ctx) => ((await bingeRecord(q, ctx))?.count ?? 0) >= NF_BINGE_MIN_EPISODES,
  run: bingeRecord,
  a11yText: (p) => `Your binge record: ${p.count} episodes of ${p.series} on ${day(p.date)}.`,
});
