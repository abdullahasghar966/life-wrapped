import { AURORA_GLOWS } from '../../themes/aurora';

/**
 * The aurora theme's backdrop: three soft radial glows in the brand colours.
 * Cards drift them slowly with a loop (transform only); with reduced motion
 * they simply stay put.
 */
const PLACES = [
  '-top-[20%] -left-[30%] size-[120cqw]',
  'top-[25%] -right-[40%] size-[120cqw]',
  '-bottom-[25%] -left-[10%] size-[100cqw]',
];

export function AuroraSky({ intensity = 0.32 }: { intensity?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {AURORA_GLOWS.map((color, i) => (
        <div
          key={color}
          data-aurora
          className={`absolute rounded-full ${PLACES[i]}`}
          style={{
            background: `radial-gradient(closest-side, color-mix(in srgb, ${color} ${Math.round(intensity * 100)}%, transparent), transparent)`,
          }}
        />
      ))}
    </div>
  );
}
