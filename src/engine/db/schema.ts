/** DuckDB schema (MASTER_PROMPT §7). Tables are rebuilt whenever the data or time zone changes. */
export const SCHEMA_SQL = `
DROP VIEW IF EXISTS media_events;
DROP TABLE IF EXISTS spotify_plays;
DROP TABLE IF EXISTS youtube_watches;
DROP TABLE IF EXISTS youtube_searches;
DROP TABLE IF EXISTS netflix_views;

CREATE TABLE spotify_plays (
  ts_utc TIMESTAMP, local_ts TIMESTAMP, local_date DATE, local_hour UTINYINT, local_dow UTINYINT,
  ms_played INTEGER, kind VARCHAR,
  track VARCHAR, artist VARCHAR, album VARCHAR, track_uri VARCHAR,
  episode VARCHAR, "show" VARCHAR,
  platform VARCHAR, country VARCHAR, reason_end VARCHAR,
  skipped BOOLEAN, shuffle BOOLEAN, offline BOOLEAN, private_session BOOLEAN,
  source VARCHAR
);

CREATE TABLE youtube_watches (
  ts_utc TIMESTAMP, local_ts TIMESTAMP, local_date DATE, local_hour UTINYINT, local_dow UTINYINT,
  video_id VARCHAR, title VARCHAR, channel VARCHAR,
  product VARCHAR,
  unavailable BOOLEAN, est_seconds INTEGER, session_id INTEGER
);

CREATE TABLE youtube_searches (
  ts_utc TIMESTAMP, local_ts TIMESTAMP, local_date DATE, local_hour UTINYINT, query VARCHAR
);

CREATE TABLE netflix_views (
  ts_utc TIMESTAMP, local_ts TIMESTAMP, local_date DATE, local_hour UTINYINT, local_dow UTINYINT,
  duration_s INTEGER, title_raw VARCHAR, series VARCHAR, season VARCHAR, episode VARCHAR,
  is_series BOOLEAN, device_class VARCHAR, country_code VARCHAR, country_name VARCHAR, profile VARCHAR
);

CREATE VIEW media_events AS
  SELECT 'spotify' AS platform, local_ts, local_date, local_hour, local_dow,
         ms_played / 1000.0 AS seconds, FALSE AS estimated, NULL AS profile, private_session FROM spotify_plays
  UNION ALL
  SELECT 'youtube', local_ts, local_date, local_hour, local_dow, est_seconds, TRUE, NULL, FALSE FROM youtube_watches
  UNION ALL
  SELECT 'netflix', local_ts, local_date, local_hour, local_dow, duration_s, FALSE, profile, FALSE FROM netflix_views;
`;
