import type { Row } from '../db/types';
import type { DeckId, Period } from '../types';

export type QueryFn = <T extends Row = Row>(
  sql: string,
  params?: readonly unknown[],
) => Promise<T[]>;

/** Everything an insight may depend on besides the tables themselves. */
export interface DataCtx {
  period: Period;
  timeZone: string;
  /** Selected Netflix profile ("you"); other profiles are never queried. */
  netflixProfile: string | null;
  includePrivateSessions: boolean;
  includeSearches: boolean;
  isSample: boolean;
  /** First local date per platform across all data (not just the period). */
  dataStart: Partial<Record<'spotify' | 'youtube' | 'netflix', string>>;
  /** Platform decks available for this period/profile. */
  availablePlatforms: Array<'spotify' | 'youtube' | 'netflix'>;
}

/** Whitelisted summary data that may leave the device when the user shares a card. */
export interface SharePayload {
  cardType: string;
  theme: 'sound' | 'watch' | 'binge' | 'aurora';
  numbers: Record<string, number>;
  names: Record<string, string>;
}

export interface InsightDef<P> {
  /** e.g. 'spotify.topArtist' */
  id: string;
  deck: DeckId;
  /** Position in the deck. */
  order: number;
  /** Card title for aria labels ("3 of 12: Top artist"). */
  title: string;
  /** Minimum-data rule; false → the card is hidden. */
  requires: (q: QueryFn, ctx: DataCtx) => boolean | Promise<boolean>;
  /** Parameterised SQL only. Return null when the result isn't worth a card. */
  run: (q: QueryFn, ctx: DataCtx) => Promise<P | null>;
  /** One plain-language sentence for screen readers. */
  a11yText: (p: P) => string;
  /** Summary cards only. */
  share?: (p: P, ctx: DataCtx) => SharePayload;
}

export interface InsightResult<P = unknown> {
  id: string;
  deck: DeckId;
  order: number;
  title: string;
  props: P;
  a11y: string;
  shareable: boolean;
  share?: SharePayload;
  /** Stable hash of the data, used to pick copy variants deterministically. */
  seed: number;
}
