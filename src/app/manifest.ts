import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Life, Wrapped',
    short_name: 'Life, Wrapped',
    description:
      'Your Spotify, YouTube and Netflix exports as animated story decks. Everything runs on your device.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3EFE6',
    theme_color: '#F3EFE6',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
