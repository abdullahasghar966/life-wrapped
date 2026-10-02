'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '../../gsap';
import { useCardRuntime } from '../../runtime';

const nf = new Intl.NumberFormat('en-US');

/**
 * The final value is real text for screen readers from the start; only an
 * aria-hidden visual copy counts up (§10.4). Without JS, or with reduced motion,
 * the visual copy simply shows the final value.
 */
export function CountUp({
  value,
  format = (n) => nf.format(Math.round(n)),
  delay = 0.2,
  duration = 1.6,
  className,
  visualClassName,
  prefix = '',
  suffix = '',
}: {
  value: number;
  format?: (n: number) => string;
  delay?: number;
  duration?: number;
  className?: string;
  /**
   * Classes for the visible digits only. Text effects such as background-clip:
   * text must go here: on a parent they would also paint the screen-reader copy.
   */
  visualClassName?: string;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { controller, reduced } = useCardRuntime();
  const final = `${prefix}${format(value)}${suffix}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (reduced || !el) return;
      const proxy = { v: 0 };
      const tween = gsap.to(proxy, {
        v: value,
        delay,
        duration,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = `${prefix}${format(proxy.v)}${suffix}`;
        },
      });
      el.textContent = `${prefix}${format(0)}${suffix}`;
      controller.add(tween);
      return () => controller.remove(tween);
    },
    { dependencies: [value, reduced] },
  );

  return (
    <span className={className}>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden="true" className={`tabular-nums ${visualClassName ?? ''}`}>
        {final}
      </span>
    </span>
  );
}
