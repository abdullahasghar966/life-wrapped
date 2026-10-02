'use client';
import { gsap } from '../../gsap';

/**
 * Slow, organic drifting of a card's aurora glows: one tween per glow with its
 * own duration, so they never move in unison. Scoped to the card's element.
 */
export function auroraDrift(
  scope: HTMLElement | null,
  loop: (a: gsap.core.Animation) => void,
): void {
  if (!scope) return;
  gsap.utils.toArray<HTMLElement>('[data-aurora]', scope).forEach((el, i) => {
    loop(
      gsap.to(el, {
        x: `${i % 2 ? -12 : 14}cqw`,
        y: `${i === 1 ? 10 : -8}cqw`,
        duration: 9 + i * 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: i * 0.6,
      }),
    );
  });
}
