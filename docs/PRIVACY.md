# Privacy

Life, Wrapped turns your Spotify, YouTube and Netflix exports into stories **inside your browser tab**. This page explains exactly what happens to your data and how you can check it yourself.

## Where your data goes

1. You choose files. The browser hands them to a Web Worker running in the same tab.
2. The worker unzips only the entries that look like export files (see below), reads them, keeps the fields it needs and drops the rest.
3. The rows go into an in-memory DuckDB database inside the worker. Every chart and number is a query against it.
4. Your data is never written to disk, `localStorage`, IndexedDB or cookies. Close or reload the tab and it is gone. "Clear my data" wipes it immediately.

There are no analytics, no telemetry and no third-party scripts. Fonts and the DuckDB engine are served from this site. The one exception is optional and yours to choose: playing one of your top songs or videos loads Spotify's or YouTube's own player (see [Playing a song or video](#playing-a-song-or-video-optional)).

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

## Sharing the image to other apps

Every card has a **Share** button. It makes a picture of the card inside your browser, shows it to you, and, when you press **Share image…**, hands it to your device's own share sheet. You pick the app (Instagram, Snapchat, WhatsApp, Messages…) and post from there, signed in as you already are. Life, Wrapped never signs in to those apps, has no access to your accounts, and makes no request of its own: your browser passes the picture to the app on your device. What the app then does with the picture is up to you and that app, as with any photo you share.

If your browser can't pass pictures to other apps (most desktop browsers can't), the sheet offers **Save image** instead.

## Sharing a link (optional)

Sharing a link is the only time anything is sent to a server, and it only happens when you ask.

1. Only the last card of each story (the summary) can become a link: in its **Share** sheet, press **Create a link…**.
2. That shows "This is everything that will be shared:" followed by the exact JSON. Nothing is sent until you press **Confirm and share**, and the request carries exactly that text, character for character (an automated test checks this).
3. You get a link such as `/s/Ab3dE5fG7h` that anyone can open. You can copy it or pass it to your device's share sheet; the shared page has a **Share this card** button too.

**What a shared card contains.** A fixed list of numbers and a few short names per card, plus whether it came from the sample data:

| Card                  | Numbers                                                                     | Names                                 |
| --------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| Your year in sound    | minutes listened, longest streak                                            | top artist, top song, listening style |
| Your year of watching | videos, hours (estimated), longest rabbit hole (videos, minutes), peak hour | top channel                           |
| Your year on screen   | hours, binge record (episodes)                                              | top series, persona                   |
| Your online life      | hours, days, share of time on each platform                                 | personality, most-used platform       |

The server accepts nothing else: unknown fields are rejected (not ignored), there are at most 5 names of at most 80 characters each with control characters removed, and the whole request is at most 4 KB. No listening, watching or search history can be stored, because the server has nowhere to put it.

**What the server stores.** An id, the time it was shared, the card type and theme, the sample flag, the numbers and names above, and a SHA-256 hash of a random delete token. The token itself stays in your browser's `localStorage`. That is the only thing Life, Wrapped ever writes to your browser, and only after you share.

**Rate limiting.** Each address can share at most 10 cards an hour. The limit is counted with a salted SHA-256 hash of the IP address; the address itself is never stored, and hashes older than an hour are removed whenever a card is shared.

**Deleting.** Open your link in the browser you shared it from and press **Delete this card**. The row is removed at once, and both the page and its link-preview image stop working for everyone.

**Link previews.** When a link is pasted into a chat app, the preview image is drawn on the server from the same numbers and names, using fonts that ship with the app. A name those fonts can't draw (for example in Japanese, or with an emoji) is left off the image, because drawing it would mean downloading a font from another company's server.

If the site runs without a database, the Share button explains that sharing isn't set up, and everything else works the same.

## Playing a song or video (optional)

With your own Spotify or YouTube data, the Spotify story offers your five most-played songs, and the YouTube story your five most-watched videos, to play while you watch (ADR-040). Each offer pops up once per tab, never when you're offline, and the music button in the story's controls brings it back.

- **Nothing is loaded from Spotify or YouTube until you pick one.** The list uses generated art, not real covers or thumbnails.
- **What the platform learns.** Your pick loads that platform's own player in a frame on the page: Spotify's player (`open.spotify.com`), or YouTube's in its privacy-enhanced mode (`www.youtube-nocookie.com`). That company learns which song or video you picked and sees your IP address, and like any website it may set its own cookies. YouTube is also told this site's address, but not the page, because its player won't play without it.
- **What it can't do.** Nothing else from your files is sent. The frame can't read this page or navigate it away.
- **The security policy.** The page's Content Security Policy allows frames from exactly those two players (`frame-src`), and `connect-src 'self'` still stops the page from sending data anywhere else.
- **Which songs.** The songs are the same list as the "Top 5 songs" card, so private sessions stay out unless you include them. Ads and removed videos are never offered.
- **The sample.** It never offers anything to play: its songs and videos are made up.
- **Spotify's Account data export** has no track ids. Its songs get a "Find on Spotify" link that opens a search in a new tab instead.

## Verify it yourself

You don't have to take our word for it.

1. Open the site and your browser's developer tools (F12, or right-click → Inspect), then the **Network** tab. Tick **Preserve log**.
2. Load your files, or the sample, and play every story. Save an image, or share one to another app.
3. Look at the list of requests. Every one goes to this site's own address: the pages, scripts, fonts and the DuckDB engine files. Click any request: none carries a **Payload** with your data. (If you picked a song or video to play, its player's frame also talks to Spotify or YouTube, and only after your pick.)
4. Try to break it. In the **Console** tab, run `fetch('https://example.com', { method: 'POST', body: 'test' })`. The browser refuses with a Content Security Policy error: the page's `connect-src 'self'` rule only lets it talk to its own site, even if a script tried to send data elsewhere.
5. Turn off your Wi-Fi. After one visit, the whole app keeps working: adding files, playing every story, saving images. Your browser keeps a copy of the app, including the database engine, so there is nothing to send and nowhere to send it. (Only opening someone else's shared link, or playing a song or video, needs a connection.)

The same checks run automatically on every change: [`tests/e2e/privacy.spec.ts`](../tests/e2e/privacy.spec.ts) loads real-format exports and the sample, plays all four stories, saves an image and passes one to the share sheet, and fails if any request goes to another website or carries data. It also checks that the policy blocks a request to another site. [`tests/e2e/offline.spec.ts`](../tests/e2e/offline.spec.ts) does the Wi-Fi test, and [`tests/e2e/media.spec.ts`](../tests/e2e/media.spec.ts) checks that nothing loads from Spotify or YouTube until you pick something to play.

## What your browser stores

- **The app itself**, for offline use: its pages, scripts, fonts and the DuckDB engine (about 38 MB), kept by a service worker in the browser's cache. None of it is your data.
- **Delete tokens**, in `localStorage`, only after you share a card.

Nothing else: no cookies, no history, no files. (If you play a song or video, Spotify's or YouTube's player may store cookies for its own site, as it would anywhere.)
