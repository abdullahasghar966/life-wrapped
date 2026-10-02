import { boolean, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * The only data the server ever stores: summary cards people chose to share.
 * `payload` is a whitelisted handful of numbers and short names (≤ 4 KB); raw
 * rows can't get here (see src/share/schema.ts). The delete token is stored
 * only as a SHA-256 hash.
 */
export const sharedCards = pgTable('shared_cards', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  cardType: text('card_type').notNull(),
  theme: text('theme').notNull(),
  isSample: boolean('is_sample').notNull().default(false),
  payload: jsonb('payload').notNull(),
  deleteTokenHash: text('delete_token_hash').notNull(),
});

/**
 * One row per share, keyed by sha256(ip + SHARE_SALT), used to allow 10 shares
 * per hour. Raw IPs are never stored; rows older than an hour are pruned.
 */
export const shareRateLimits = pgTable(
  'share_rate_limits',
  {
    keyHash: text('key_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('share_rate_limits_key_created_idx').on(t.keyHash, t.createdAt)],
);

export type SharedCardRow = typeof sharedCards.$inferSelect;
