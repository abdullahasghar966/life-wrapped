import { tableFromArrays } from 'apache-arrow';
import { estimateWatches } from '../ingest/youtubeEstimate';
import type { Dataset } from '../ingest/pipeline';
import { TimeConverter } from '../ingest/time';
import { SCHEMA_SQL } from './schema';
import type { Db } from './types';

const LOCAL_COLS = `
  epoch_ms(CAST(ts AS BIGINT)) AS ts_utc,
  epoch_ms(CAST(local_ms AS BIGINT)) AS local_ts,
  CAST(local_date AS DATE) AS local_date,
  CAST(local_hour AS UTINYINT) AS local_hour`;

function localColumns<T extends { ts: number }>(rows: readonly T[], tc: TimeConverter) {
  const n = rows.length;
  const ts = new Float64Array(n);
  const localMs = new Float64Array(n);
  const localDate = new Array<string>(n);
  const localHour = new Int32Array(n);
  const localDow = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const t = rows[i]!.ts;
    const p = tc.toLocal(t);
    ts[i] = t;
    localMs[i] = p.localMs;
    localDate[i] = p.date;
    localHour[i] = p.hour;
    localDow[i] = p.dow;
  }
  return {
    ts,
    local_ms: localMs,
    local_date: localDate,
    local_hour: localHour,
    local_dow: localDow,
  };
}

async function stageAndInsert(
  db: Db,
  stage: string,
  columns: Record<string, unknown>,
  insertSql: string,
) {
  // Arrow can't infer a type for an empty or all-null column, so skip empty tables entirely.
  const first = Object.values(columns)[0] as ArrayLike<unknown> | undefined;
  if (!first || first.length === 0) return;
  await db.exec(`DROP TABLE IF EXISTS ${stage}`);
  await db.insertArrow(stage, tableFromArrays(columns as Parameters<typeof tableFromArrays>[0]));
  await db.exec(insertSql);
  await db.exec(`DROP TABLE ${stage}`);
}

/**
 * Nulls travel as '' and become NULL again via NULLIF in SQL, so Arrow always sees
 * a plain string column (it can't infer a type for an all-null column). Parsers
 * already turn empty strings into null, so '' is unambiguous.
 */
const strings = (values: Array<string | null>) => values.map((v) => v ?? '');

/** Rebuilds every table from the in-memory dataset for one time zone. */
export async function loadDataset(db: Db, data: Dataset, timeZone: string): Promise<void> {
  const tc = new TimeConverter(timeZone);
  await db.exec(SCHEMA_SQL);

  const sp = data.spotify;
  await stageAndInsert(
    db,
    'stage_spotify',
    {
      ...localColumns(sp, tc),
      ms: new Int32Array(sp.map((r) => r.ms)),
      kind: sp.map((r) => r.kind),
      track: strings(sp.map((r) => r.track)),
      artist: strings(sp.map((r) => r.artist)),
      album: strings(sp.map((r) => r.album)),
      uri: strings(sp.map((r) => r.uri)),
      episode: strings(sp.map((r) => r.episode)),
      show_name: strings(sp.map((r) => r.show)),
      platform: strings(sp.map((r) => r.platform)),
      country: strings(sp.map((r) => r.country)),
      reason_end: strings(sp.map((r) => r.reasonEnd)),
      skipped: sp.map((r) => r.skipped),
      shuffle: sp.map((r) => r.shuffle ?? false),
      offline: sp.map((r) => r.offline ?? false),
      private_session: sp.map((r) => r.privateSession),
      source: sp.map((r) => r.source),
    },
    `INSERT INTO spotify_plays SELECT ${LOCAL_COLS}, CAST(local_dow AS UTINYINT),
       ms, kind, NULLIF(track, ''), NULLIF(artist, ''), NULLIF(album, ''), NULLIF(uri, ''),
       NULLIF(episode, ''), NULLIF(show_name, ''), NULLIF(platform, ''), NULLIF(country, ''), NULLIF(reason_end, ''),
       skipped, shuffle, offline, private_session, source
     FROM stage_spotify`,
  );

  const yw = [...data.youtubeWatches].sort((a, b) => a.ts - b.ts);
  const est = estimateWatches(yw.map((r) => r.ts));
  await stageAndInsert(
    db,
    'stage_ytw',
    {
      ...localColumns(yw, tc),
      video_id: strings(yw.map((r) => r.videoId)),
      title: strings(yw.map((r) => r.title)),
      channel: strings(yw.map((r) => r.channel)),
      product: yw.map((r) => r.product),
      unavailable: yw.map((r) => r.unavailable),
      est_seconds: new Int32Array(est.estSeconds),
      session_id: new Int32Array(est.sessionIds),
    },
    `INSERT INTO youtube_watches SELECT ${LOCAL_COLS}, CAST(local_dow AS UTINYINT),
       NULLIF(video_id, ''), NULLIF(title, ''), NULLIF(channel, ''), product, unavailable, est_seconds, session_id
     FROM stage_ytw`,
  );

  const ys = data.youtubeSearches;
  await stageAndInsert(
    db,
    'stage_yts',
    { ...localColumns(ys, tc), query: ys.map((r) => r.query) },
    `INSERT INTO youtube_searches SELECT ${LOCAL_COLS}, query FROM stage_yts`,
  );

  const nf = data.netflix;
  await stageAndInsert(
    db,
    'stage_nf',
    {
      ...localColumns(nf, tc),
      duration_s: new Int32Array(nf.map((r) => r.durationS)),
      title_raw: nf.map((r) => r.titleRaw),
      series: strings(nf.map((r) => r.series)),
      season: strings(nf.map((r) => r.season)),
      episode: strings(nf.map((r) => r.episode)),
      is_series: nf.map((r) => r.isSeries),
      device_class: nf.map((r) => r.deviceClass),
      country_code: strings(nf.map((r) => r.countryCode)),
      country_name: strings(nf.map((r) => r.countryName)),
      profile: nf.map((r) => r.profile),
    },
    `INSERT INTO netflix_views SELECT ${LOCAL_COLS}, CAST(local_dow AS UTINYINT),
       duration_s, title_raw, NULLIF(series, ''), NULLIF(season, ''), NULLIF(episode, ''), is_series,
       device_class, NULLIF(country_code, ''), NULLIF(country_name, ''), profile
     FROM stage_nf`,
  );
}
