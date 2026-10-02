/**
 * Decorative cinema layers for the binge theme: a static film-grain texture
 * (an inline SVG noise tile, so nothing is fetched), a vignette and a red glow.
 * All static, so they cost nothing per frame.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }}
    />
  );
}

export function Vignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,color-mix(in_srgb,var(--t-bg)_70%,transparent)_100%)]"
    />
  );
}

/** A soft accent-coloured glow. Position it with className. */
export function RedGlow({ className, strength = 0.55 }: { className?: string; strength?: number }) {
  return (
    <div
      aria-hidden
      data-glow
      className={`pointer-events-none absolute rounded-full ${className ?? ''}`}
      style={{
        background: `radial-gradient(circle, color-mix(in srgb, var(--c-accent) ${Math.round(strength * 100)}%, transparent) 0%, transparent 70%)`,
      }}
    />
  );
}

/** The usual binge backdrop: grain over a vignette. */
export function CinemaLayers() {
  return (
    <>
      <Vignette />
      <Grain />
    </>
  );
}
