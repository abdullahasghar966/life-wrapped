# Privacy

Life, Wrapped turns your Spotify, YouTube and Netflix exports into stories **inside your browser tab**. This page explains exactly what happens to your data and how you can check it yourself.

## Where your data goes

1. You choose files. The browser hands them to a Web Worker running in the same tab.
2. The worker unzips only the entries that look like export files (see below), reads them, keeps the fields it needs and drops the rest.
3. The rows go into an in-memory DuckDB database inside the worker. Every chart and number is a query against it.
4. Nothing is written to disk, `localStorage`, IndexedDB or cookies. Close or reload the tab and it is gone. "Clear my data" wipes it immediately.

There are no analytics, no telemetry and no third-party scripts. Fonts and the DuckDB engine are served from this site.

## Which files are opened inside a zip

Only these are decompressed; everything else in your export (account details, payment history, mail…) is skipped without being opened:

- Spotify: `StreamingHistory*.json`, `Streaming_History_Audio_*.json`, `Streaming_History_Video_*.json`, `endsong_*.json`
- YouTube: `watch-history.json`, `search-history.json` (and their `.html` versions, only to tell you to re-export as JSON), plus JSON files inside a folder whose name mentions "YouTube" because Takeout translates file names
- Netflix: `ViewingActivity.csv`

## Fields that are dropped at parse time

These are discarded the moment a row is read and are never stored, not even in the in-memory tables:

| Platform | Dropped fields                                                                          |
| -------- | --------------------------------------------------------------------------------------- |
| Spotify  | `ip_addr`, `ip_addr_decrypted`, `user_agent_decrypted`, `username`, `offline_timestamp` |
| Netflix  | `Bookmark`, `Latest Bookmark`                                                           |
| YouTube  | `activityControls`                                                                      |

On top of that, every parser uses a schema that keeps only known fields, so anything new a platform adds to its export is dropped by default.

## Other people's data

A Netflix export contains every profile on the account. You choose which profile is you; only that profile is ever queried or shown.

Spotify private sessions count towards your totals, but they are left out of top lists and anything shareable unless you turn on "Include private sessions".

YouTube searches are off by default for real data, because search history is often more personal than watch history.

## Sharing (optional)

_Documented when sharing lands (M5)._

## Verify it yourself

_Step-by-step instructions land in M5/M6._ In short: open DevTools → Network, load your files, and watch that nothing is sent. The site's Content Security Policy (`connect-src 'self'`) also makes it impossible for the page to send data to any other website.
