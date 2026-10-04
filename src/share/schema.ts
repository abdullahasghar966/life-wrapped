import {
  SHARE_MAX_BYTES,
  SHARE_MAX_NAME_LENGTH,
  SHARE_MAX_NAMES,
} from '@/engine/insights/constants';
import { z } from '@/lib/zod';

/**
 * The share whitelist (§13). For each summary card type: which numbers and which
 * short names may leave the device, and nothing else. Unknown keys are rejected,
 * not stripped, so a client can't smuggle extra data through.
 */
export const SHAREABLE = {
  'spotify.summary': {
    theme: 'sound',
    numbers: ['minutes', 'streak'],
    names: ['topArtist', 'topTrack', 'persona'],
  },
  'youtube.summary': {
    theme: 'watch',
    numbers: ['videos', 'hours', 'rabbitHoleVideos', 'rabbitHoleMinutes', 'peakHour'],
    names: ['topChannel'],
  },
  'netflix.summary': {
    theme: 'binge',
    numbers: ['hours', 'bingeEpisodes'],
    names: ['persona', 'topSeries'],
  },
  'life.summary': {
    theme: 'receipt',
    numbers: ['hours', 'days', 'spotifyShare', 'youtubeShare', 'netflixShare'],
    names: ['archetype', 'top'],
  },
} as const;

export type ShareCardType = keyof typeof SHAREABLE;
export const SHARE_CARD_TYPES = Object.keys(SHAREABLE) as ShareCardType[];

/** Removes control characters and trims; names are display text only. */
export function cleanName(s: string): string {
  return s.replace(/\p{Cc}/gu, '').trim();
}

const shareNumber = z.number().min(0).max(10_000_000);
const shareName = z
  .string()
  .transform(cleanName)
  .pipe(z.string().min(1).max(SHARE_MAX_NAME_LENGTH));

function payloadSchema(type: ShareCardType) {
  const spec = SHAREABLE[type];
  return z.strictObject({
    cardType: z.literal(type),
    theme: z.literal(spec.theme),
    numbers: z.partialRecord(z.enum(spec.numbers), shareNumber),
    names: z.partialRecord(z.enum(spec.names), shareName),
  });
}

export const SharePayloadSchema = z
  .discriminatedUnion('cardType', [
    payloadSchema('spotify.summary'),
    payloadSchema('youtube.summary'),
    payloadSchema('netflix.summary'),
    payloadSchema('life.summary'),
  ])
  .refine((p) => Object.keys(p.names).length <= SHARE_MAX_NAMES, {
    message: `At most ${SHARE_MAX_NAMES} names`,
  });

export const ShareRequestSchema = z.strictObject({
  payload: SharePayloadSchema,
  isSample: z.boolean(),
});

export type ShareRequest = z.infer<typeof ShareRequestSchema>;
export type ValidSharePayload = z.infer<typeof SharePayloadSchema>;

/**
 * Turns a card's share payload into the exact request the server will accept:
 * names are cleaned and shortened here, so the preview shows precisely what
 * leaves the device. Returns null if the card isn't shareable.
 */
export function buildShareRequest(
  share: {
    cardType: string;
    theme: string;
    numbers: Record<string, number>;
    names: Record<string, string>;
  },
  isSample: boolean,
): ShareRequest | null {
  const names = Object.fromEntries(
    Object.entries(share.names).map(([k, v]) => [k, cleanName(v).slice(0, SHARE_MAX_NAME_LENGTH)]),
  );
  const parsed = ShareRequestSchema.safeParse({ payload: { ...share, names }, isSample });
  return parsed.success ? parsed.data : null;
}

/** The exact JSON a share sends: what the preview shows and what the server receives. */
export function shareBody(req: ShareRequest): string {
  return JSON.stringify(req, null, 2);
}

export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

export { SHARE_MAX_BYTES };
