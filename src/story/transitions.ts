'use client';
import { gsap } from './gsap';
import type { ThemeId } from './themes/tokens';

/**
 * Card-to-card transitions (§10.2), transform and opacity only:
 * sound = colour-wipe blob, watch = vertical swipe, binge = fade through black,
 * aurora = crossfade with a drift. Reduced motion gets a plain 200 ms fade.
 */
export function enterSlide(
  el: HTMLElement,
  theme: ThemeId,
  direction: 1 | -1,
  reduced: boolean,
): gsap.core.Animation {
  if (reduced) return gsap.from(el, { opacity: 0, duration: 0.2, ease: 'none' });
  switch (theme) {
    case 'sound': {
      const blob = el.querySelector<HTMLElement>('[data-wipe]');
      const content = el.querySelector<HTMLElement>('[data-card-content]');
      const tl = gsap.timeline();
      if (blob) {
        // The blob grows from the side you tapped towards, then settles centred.
        tl.fromTo(
          blob,
          { scale: 0, xPercent: direction > 0 ? -10 : -90, yPercent: -50 },
          { scale: 1, xPercent: -50, yPercent: -50, duration: 0.55, ease: 'power3.inOut' },
        );
      }
      if (content) tl.from(content, { opacity: 0, duration: 0.25, ease: 'none' }, 0.25);
      return tl;
    }
    case 'watch':
      return gsap.from(el, {
        yPercent: direction > 0 ? 100 : -100,
        duration: 0.35,
        ease: 'power3.out',
      });
    case 'binge':
      return gsap.from(el, { opacity: 0, duration: 0.8, ease: 'expo.out' });
    case 'aurora':
      return gsap.from(el, {
        opacity: 0,
        yPercent: 3 * direction,
        duration: 1.1,
        ease: 'sine.inOut',
      });
  }
}
