'use client';
import type { InsightResult } from '@/engine/insights/types';
import { SUMMARY_CARDS } from '@/story/cards/summaries';
import { Slide } from '@/story/Slide';
import { THEMES, themeStyle } from '@/story/themes';
import type { ShareCardType } from './schema';

/**
 * A shared summary card, drawn by the same component as in the story but in its
 * final, still frame (no entrance, no count-up), so the server-rendered HTML is
 * already the finished card.
 */
export function SharedCard({
  cardType,
  theme: themeId,
  result,
}: {
  cardType: ShareCardType;
  theme: keyof typeof THEMES;
  result: InsightResult;
}) {
  const theme = THEMES[themeId];
  const { Component, backdrop } = SUMMARY_CARDS[cardType];
  return (
    <div
      data-theme={theme.id}
      data-testid="shared-card"
      style={themeStyle(theme)}
      className="relative aspect-[9/16] w-full overflow-hidden rounded-(--t-radius-frame) bg-(--t-bg) shadow-2xl"
    >
      <Slide
        theme={theme}
        backdrop={theme.backdrops[backdrop % theme.backdrops.length]!}
        reduced
        seed={result.seed}
        direction={1}
        label={result.title}
        still
      >
        <Component result={result} />
      </Slide>
    </div>
  );
}
