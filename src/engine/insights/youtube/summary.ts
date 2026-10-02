import { YT_RABBIT_HOLE_MIN_MIN, YT_TOP_CHANNEL_MIN_CHANNELS } from '../constants';
import { hour12, n } from '../copy';
import { define } from '../helpers';
import nightOwl from './nightOwl';
import { distinctChannels, longestSession } from './shared';
import topChannel from './topChannel';
import total from './total';

export interface YoutubeSummary {
  videos: number;
  hours: number;
  topChannel: string | null;
  rabbitHole: { videos: number; minutes: number } | null;
  peakHour: number | null;
}

export default define<YoutubeSummary>({
  id: 'youtube.summary',
  deck: 'youtube',
  order: 11,
  title: 'That’s a wrap on your year of watching',
  requires: () => true,
  async run(q, ctx) {
    const t = await total.run(q, ctx);
    const channel =
      (await distinctChannels(q, ctx)) >= YT_TOP_CHANNEL_MIN_CHANNELS
        ? await topChannel.run(q, ctx)
        : null;
    const hole = await longestSession(q, ctx);
    const night = (await nightOwl.requires(q, ctx)) ? await nightOwl.run(q, ctx) : null;
    return {
      videos: t?.videos ?? 0,
      hours: t?.hours ?? 0,
      topChannel: channel?.channel ?? null,
      rabbitHole:
        hole && hole.minutes >= YT_RABBIT_HOLE_MIN_MIN
          ? { videos: hole.videos, minutes: hole.minutes }
          : null,
      peakHour: night?.peakHour ?? null,
    };
  },
  a11yText: (p) =>
    [
      `Summary: ${n(p.videos)} videos, about ${n(p.hours)} hours.`,
      p.topChannel && `Top channel ${p.topChannel}.`,
      p.rabbitHole && `Longest rabbit hole ${p.rabbitHole.videos} videos.`,
      p.peakHour !== null && `Peak hour ${hour12(p.peakHour)}.`,
    ]
      .filter(Boolean)
      .join(' '),
  share(p) {
    const numbers: Record<string, number> = { videos: p.videos, hours: p.hours };
    if (p.rabbitHole) numbers.rabbitHoleVideos = p.rabbitHole.videos;
    if (p.peakHour !== null) numbers.peakHour = p.peakHour;
    const names: Record<string, string> = {};
    if (p.topChannel) names.topChannel = p.topChannel;
    return { cardType: 'youtube.summary', theme: 'watch', numbers, names };
  },
});
