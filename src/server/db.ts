import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import path from 'node:path';
import * as schema from './schema';

/**
 * Database access for sharing only (server code; nothing in src/server is ever
 * imported by client components). Without DATABASE_URL and SHARE_SALT the app
 * works fully and sharing reports itself as not configured.
 *
 * `DATABASE_URL=pglite://memory` runs an in-memory Postgres (PGlite) with the
 * same migrations. It is used by the E2E share tests, never in production.
 */
export type ShareDb = NeonHttpDatabase<typeof schema>;

let dbPromise: Promise<ShareDb> | null = null;

export function shareConfig(): { enabled: boolean; url: string | null; salt: string | null } {
  const url = process.env.DATABASE_URL?.trim() || null;
  const salt = process.env.SHARE_SALT?.trim() || null;
  return { enabled: !!url && !!salt, url, salt };
}

async function connect(url: string): Promise<ShareDb> {
  if (url.startsWith('pglite://')) {
    const [{ PGlite }, { drizzle: drizzlePglite }, { migrate }] = await Promise.all([
      import('@electric-sql/pglite'),
      import('drizzle-orm/pglite'),
      import('drizzle-orm/pglite/migrator'),
    ]);
    const db = drizzlePglite({ client: new PGlite(), schema });
    await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
    // Same Postgres dialect and query builder; only the transport differs.
    return db as unknown as ShareDb;
  }
  return drizzle({ client: neon(url), schema });
}

/** The shared Drizzle instance, or null when sharing isn't configured. */
export async function getDb(): Promise<ShareDb | null> {
  const { enabled, url } = shareConfig();
  if (!enabled || !url) return null;
  dbPromise ??= connect(url);
  return dbPromise;
}

/** Tests only: forget the connection so a new DATABASE_URL takes effect. */
export function resetDbForTests(): void {
  dbPromise = null;
}

export { schema };
