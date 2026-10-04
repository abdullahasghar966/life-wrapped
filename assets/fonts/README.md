# Fonts for Open Graph images

`next/og` can't read WOFF2, so the share-preview images (`src/app/s/[id]/opengraph-image.tsx`) embed these WOFF files directly. The pages load the same families through `next/font` (Archivo from `src/fonts/`, the rest from Google Fonts at build time).

| File                                                                         | Family                    | Weight   |
| ---------------------------------------------------------------------------- | ------------------------- | -------- |
| `ibm-plex-sans-latin-400-normal.woff`, `ibm-plex-sans-latin-600-normal.woff` | IBM Plex Sans             | 400, 600 |
| `ibm-plex-mono-latin-500-normal.woff`                                        | IBM Plex Mono             | 500      |
| `archivo-extra-condensed-900.ttf`                                            | Archivo (Extra Condensed) | 900      |
| `figtree-latin-900-normal.woff`                                              | Figtree                   | 900      |
| `roboto-condensed-latin-800-normal.woff`                                     | Roboto Condensed          | 800      |
| `bebas-neue-latin-400-normal.woff`                                           | Bebas Neue                | 400      |

The Archivo file is the Extra Condensed Black instance, as TTF, from [Google Fonts](https://fonts.google.com/specimen/Archivo); the rest
are from [Fontsource](https://fontsource.org) (latin subset). All are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org).
