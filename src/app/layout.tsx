import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/lib/fonts';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Life, Wrapped: your online life as a story',
    template: '%s · Life, Wrapped',
  },
  description:
    'Turn your Spotify, YouTube and Netflix data exports into animated story decks. Everything runs in your browser; your data never leaves your device.',
  applicationName: 'Life, Wrapped',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0A0A1A',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${fontVariables} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
