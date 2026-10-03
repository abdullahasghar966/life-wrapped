'use client';

/**
 * Last-resort error page, used when the root layout itself fails. It renders its
 * own document without the global stylesheet, so it carries its own styles.
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0a0a1a',
          color: '#f5f5ff',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <main>
          <title>Something went wrong · Life, Wrapped</title>
          <h1 style={{ fontSize: 32, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#a6a6c8', maxWidth: 420, margin: '16px auto 0' }}>
            Life, Wrapped hit an unexpected problem. Nothing was sent anywhere.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 32,
              padding: '12px 24px',
              borderRadius: 999,
              border: 0,
              background: '#22d3ee',
              color: '#0a0a1a',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
