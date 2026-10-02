import { n } from '../copy';
import { define } from '../helpers';
import personality, { ARCHETYPE_LABEL, type ArchetypeId } from './personality';
import {
  PLATFORM_LABEL,
  secondsByPlatform,
  sum,
  topPlatform,
  type PerPlatform,
  type Platform,
} from './shared';

export interface LifeSummary {
  hours: number;
  days: number;
  estimated: boolean;
  shares: PerPlatform;
  top: Platform;
  archetype: ArchetypeId;
  label: string;
}

export default define<LifeSummary>({
  id: 'life.summary',
  deck: 'life',
  order: 8,
  title: 'Your online life, wrapped',
  requires: () => true,
  async run(q, ctx) {
    const s = await secondsByPlatform(q, ctx);
    const total = sum(s);
    if (total <= 0) return null;
    const pers = await personality.run(q, ctx);
    const share = (v: number) => Math.round((v / total) * 1000) / 1000;
    return {
      hours: Math.round(total / 3600),
      days: Math.round(total / 86400),
      estimated: s.youtube > 0,
      shares: { spotify: share(s.spotify), youtube: share(s.youtube), netflix: share(s.netflix) },
      top: topPlatform(s),
      archetype: pers?.archetype ?? 'nightOwl',
      label: pers?.label ?? ARCHETYPE_LABEL.nightOwl,
    };
  },
  a11yText: (p) =>
    `Your online life, wrapped: ${p.estimated ? 'about ' : ''}${n(p.hours)} hours, mostly ${PLATFORM_LABEL[p.top]}. You're ${p.label}.`,
  share: (p) => ({
    cardType: 'life.summary',
    theme: 'aurora',
    numbers: {
      hours: p.hours,
      days: p.days,
      spotifyShare: p.shares.spotify,
      youtubeShare: p.shares.youtube,
      netflixShare: p.shares.netflix,
    },
    names: { archetype: p.label, top: PLATFORM_LABEL[p.top] },
  }),
});
