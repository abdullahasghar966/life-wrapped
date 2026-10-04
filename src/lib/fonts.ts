import {
  Bebas_Neue,
  Figtree,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
  Roboto,
  Roboto_Condensed,
} from 'next/font/google';
import localFont from 'next/font/local';

// next/font downloads these at build time and serves them from our own origin,
// so no font request ever leaves the site at runtime (CSP: font-src 'self').
// Only the app-shell fonts are preloaded; theme fonts load when a deck uses them.

// Archivo Extra Condensed Black, the brand's display face. Only this one static
// instance is shipped (about 35 KB): the variable font with its width axis is
// several times larger and the headline is the landing page's LCP element.
export const archivo = localFont({
  src: '../fonts/archivo-xcond-900.woff2',
  weight: '900',
  // The file carries Archivo's width axis; this pins it to Extra Condensed.
  declarations: [{ prop: 'font-stretch', value: '62%' }],
  variable: '--font-archivo',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

export const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
  preload: false,
});

// The Netflix-style deck's body text.
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

export const figtree = Figtree({
  subsets: ['latin'],
  weight: ['500', '700', '800', '900'],
  variable: '--font-figtree',
  display: 'swap',
  preload: false,
});

export const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-roboto-condensed',
  display: 'swap',
  preload: false,
});

export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
  preload: false,
});

export const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
  preload: false,
});

export const fontVariables = [
  archivo,
  plexSans,
  plexMono,
  inter,
  figtree,
  robotoCondensed,
  roboto,
  bebas,
]
  .map((f) => f.variable)
  .join(' ');
