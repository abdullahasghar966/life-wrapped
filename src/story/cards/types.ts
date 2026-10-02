import type { ComponentType } from 'react';
import type { InsightResult } from '@/engine/insights/types';

export interface CardProps<P = unknown> {
  result: InsightResult<P>;
}

export interface CardDef {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each card narrows its own props
  Component: ComponentType<CardProps<any>>;
  /** Index into the theme's backdrops; defaults to rotating by position. */
  backdrop?: number;
}
