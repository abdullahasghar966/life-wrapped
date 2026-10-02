import {
  Bebas_Neue,
  Figtree,
  Inter,
  Roboto,
  Roboto_Condensed,
  Space_Grotesk,
} from 'next/font/google';

// next/font downloads these at build time and serves them from our own origin,
// so no font request ever leaves the site at runtime (CSP: font-src 'self').
// Only the app-shell fonts are preloaded; theme fonts load when a deck uses them.

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
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

export const fontVariables = [spaceGrotesk, inter, figtree, robotoCondensed, roboto, bebas]
  .map((f) => f.variable)
  .join(' ');
