/**
 * Fields that are discarded at parse time and never stored, not even in the
 * in-memory tables (MASTER_PROMPT §6.6, listed in docs/PRIVACY.md).
 *
 * The Zod schemas also strip every field they don't know about, so anything
 * new that a platform adds to its export is dropped by default.
 */
export const DROPPED_FIELDS = {
  spotify: [
    'ip_addr',
    'ip_addr_decrypted',
    'user_agent_decrypted',
    'username',
    'offline_timestamp',
  ],
  netflix: ['Bookmark', 'Latest Bookmark'],
  youtube: ['activityControls'],
} as const;

export function minimise<T extends Record<string, unknown>>(
  source: keyof typeof DROPPED_FIELDS,
  record: T,
): T {
  for (const key of DROPPED_FIELDS[source]) {
    // Overwritten rather than deleted: the value is gone either way, and `delete`
    // would switch every row object to V8's slow dictionary mode (it costs
    // seconds on large exports). The Zod schemas drop the keys themselves.
    if (key in record) (record as Record<string, unknown>)[key] = undefined;
  }
  return record;
}
