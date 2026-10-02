import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DELETE } from '@/app/api/share/[id]/route';
import { GET, POST } from '@/app/api/share/route';
import { getDb, resetDbForTests } from '@/server/db';
import { getShare } from '@/server/shares';
import { SHARES_PER_HOUR } from '@/server/rateLimit';
import { buildShareRequest, shareBody, ShareRequestSchema } from '@/share/schema';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';

const spotifyShare = {
  cardType: 'spotify.summary',
  theme: 'sound',
  numbers: { minutes: 90537, streak: 63 },
  names: { topArtist: 'Nova Vale', topTrack: 'Paper Moons', persona: 'Night Owl' },
};

const post = (body: unknown, ip = '203.0.113.9') =>
  POST(
    new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

const del = (id: string, token?: string) =>
  DELETE(
    new Request(`http://localhost/api/share/${id}`, {
      method: 'DELETE',
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
    { params: Promise.resolve({ id }) },
  );

describe('share whitelist', () => {
  let t: TestEngine;
  beforeAll(async () => {
    t = await createTestEngine();
    await t.engine.loadSample(undefined, { timeZone: TEST_TZ });
  });
  afterAll(() => t.db.close());

  it('accepts the share payload of every summary card', async () => {
    for (const deck of ['spotify', 'youtube', 'netflix', 'life'] as const) {
      const card = (await t.engine.getDeck(deck)).find((c) => c.shareable)!;
      const req = buildShareRequest(card.share!, true);
      expect(req, deck).not.toBeNull();
      expect(new TextEncoder().encode(shareBody(req!)).length).toBeLessThan(1024);
    }
  });

  it('rejects anything outside the whitelist', () => {
    const base = { payload: spotifyShare, isSample: false };
    expect(ShareRequestSchema.safeParse(base).success).toBe(true);
    const bad = [
      { ...base, rows: [{ ts: 1 }] },
      { ...base, payload: { ...spotifyShare, extra: 1 } },
      { ...base, payload: { ...spotifyShare, numbers: { minutes: 1, ip: 3 } } },
      { ...base, payload: { ...spotifyShare, names: { username: 'x' } } },
      { ...base, payload: { ...spotifyShare, theme: 'binge' } },
      { ...base, payload: { ...spotifyShare, cardType: 'spotify.topArtist' } },
      { ...base, payload: { ...spotifyShare, numbers: { minutes: -1 } } },
      { ...base, payload: { ...spotifyShare, names: { topArtist: 'x'.repeat(81) } } },
    ];
    for (const b of bad)
      expect(ShareRequestSchema.safeParse(b).success, JSON.stringify(b)).toBe(false);
  });

  it('strips control characters and shortens long names before preview', () => {
    const req = buildShareRequest(
      { ...spotifyShare, names: { topArtist: `Nova\u0007 Vale${'!'.repeat(100)}` } },
      false,
    )!;
    expect(req.payload.names.topArtist).toHaveLength(80);
    expect(req.payload.names.topArtist!.startsWith('Nova Vale')).toBe(true);
  });
});

describe('share API without a database', () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.SHARE_SALT;
    resetDbForTests();
  });

  it('reports sharing as disabled and refuses politely', async () => {
    expect(await (await GET()).json()).toEqual({ enabled: false });
    const res = await post({ payload: spotifyShare, isSample: false });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('not_configured');
  });
});

describe('share API with a database (PGlite)', () => {
  beforeAll(() => {
    process.env.DATABASE_URL = 'pglite://memory';
    process.env.SHARE_SALT = 'unit-test-salt';
    resetDbForTests();
  });
  afterAll(() => {
    delete process.env.DATABASE_URL;
    delete process.env.SHARE_SALT;
    resetDbForTests();
  });

  it('creates, reads and deletes a share with its token', async () => {
    expect(await (await GET()).json()).toEqual({ enabled: true });
    const res = await post({ payload: spotifyShare, isSample: true });
    expect(res.status).toBe(201);
    const { id, deleteToken } = (await res.json()) as { id: string; deleteToken: string };
    expect(id).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(deleteToken.length).toBeGreaterThan(20);

    const db = (await getDb())!;
    const stored = await getShare(db, id);
    expect(stored).toMatchObject({ cardType: 'spotify.summary', theme: 'sound', isSample: true });
    expect(stored!.payload.names).toEqual(spotifyShare.names);
    // Only the hash of the delete token is stored.
    expect(JSON.stringify(stored)).not.toContain(deleteToken);

    expect((await del(id)).status).toBe(401);
    expect((await del(id, 'wrong-token')).status).toBe(403);
    expect((await del(id, deleteToken)).status).toBe(204);
    expect(await getShare(db, id)).toBeNull();
    expect((await del(id, deleteToken)).status).toBe(404);
  });

  it('rejects invalid and oversized bodies', async () => {
    expect((await post('not json')).status).toBe(400);
    expect(
      (await post({ payload: { ...spotifyShare, extra: true }, isSample: false })).status,
    ).toBe(400);
    expect(
      (await post({ payload: spotifyShare, isSample: false, pad: 'x'.repeat(5000) })).status,
    ).toBe(413);
  });

  it(`allows ${SHARES_PER_HOUR} shares per IP per hour`, async () => {
    const ip = '198.51.100.77';
    for (let i = 0; i < SHARES_PER_HOUR; i++) {
      expect((await post({ payload: spotifyShare, isSample: false }, ip)).status).toBe(201);
    }
    expect((await post({ payload: spotifyShare, isSample: false }, ip)).status).toBe(429);
    // Another address is unaffected.
    expect((await post({ payload: spotifyShare, isSample: false }, '198.51.100.78')).status).toBe(
      201,
    );
  });
});
