# Fonts for Open Graph images

`next/og` can't read WOFF2, so the share-preview images (`src/app/s/[id]/opengraph-image.tsx`) embed these WOFF files directly. The pages themselves load the same families through `next/font/google`.

| File                                                         | Family           | Weight   |
| ------------------------------------------------------------ | ---------------- | -------- |
| `space-grotesk-latin-700-normal.woff`                        | Space Grotesk    | 700      |
| `inter-latin-500-normal.woff`, `inter-latin-700-normal.woff` | Inter            | 500, 700 |
| `figtree-latin-900-normal.woff`                              | Figtree          | 900      |
| `roboto-condensed-latin-800-normal.woff`                     | Roboto Condensed | 800      |
| `bebas-neue-latin-400-normal.woff`                           | Bebas Neue       | 400      |

All are from [Fontsource](https://fontsource.org) (latin subset) and licensed under the [SIL Open Font License 1.1](https://openfontlicense.org).
