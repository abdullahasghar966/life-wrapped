'use client';
import { gsap } from './gsap';

/**
 * 3D motion (ADR-039), built from CSS 3D transforms and GSAP: only transform and
 * opacity move. Perspective is set for the length of an animation and cleared
 * afterwards, so a still frame renders exactly as it did without 3D. Nothing here
 * runs with reduced motion; callers check it first, as cards already do.
 */

type Targets = gsap.TweenTarget;

const CUBE = { out: 0.42, in: 0.55, perspective: 1400 } as const;

/** Half the element's width, for turning it around a cube's centre instead of its own plane. */
const cubeOrigin = (el: HTMLElement) => `50% 50% ${-el.getBoundingClientRect().width / 2}px`;

/**
 * Moving to the next deck turns the story like a cube, the way story apps move to
 * the next person's stories: this face turns away to the left (then `cubeIn`).
 */
export function cubeOut(
  scene: HTMLElement,
  face: HTMLElement,
  shade: HTMLElement | null,
): Promise<void> {
  return new Promise((resolve) => {
    gsap.set(scene, { perspective: CUBE.perspective });
    const tl = gsap.timeline({ onComplete: () => resolve() });
    tl.to(face, {
      rotationY: -90,
      transformOrigin: cubeOrigin(face),
      duration: CUBE.out,
      ease: 'power2.in',
    });
    if (shade) tl.to(shade, { opacity: 0.55, duration: CUBE.out, ease: 'power1.in' }, 0);
  });
}

/** The next deck's face turns in from the right and settles flat. */
export function cubeIn(
  scene: HTMLElement,
  face: HTMLElement,
  shade: HTMLElement | null,
): gsap.core.Timeline {
  gsap.set(scene, { perspective: CUBE.perspective });
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(face, { clearProps: 'transform,transformOrigin' });
      gsap.set(scene, { clearProps: 'perspective' });
    },
  });
  tl.fromTo(
    face,
    { rotationY: 90, transformOrigin: cubeOrigin(face) },
    { rotationY: 0, duration: CUBE.in, ease: 'power3.out' },
  );
  if (shade) {
    tl.fromTo(shade, { opacity: 0.55 }, { opacity: 0, duration: CUBE.in, ease: 'power2.out' }, 0);
  }
  return tl;
}

interface At {
  at?: number | string;
  stagger?: number;
  duration?: number;
  ease?: string;
}

/** Rows swing down into place around their top edge, like flaps on a hinge. */
export function hingeIn(tl: gsap.core.Timeline, targets: Targets, o: At = {}) {
  return tl.from(
    targets,
    {
      rotationX: -100,
      z: -40,
      transformOrigin: '50% 0%',
      transformPerspective: 700,
      opacity: 0,
      duration: o.duration ?? 0.7,
      ease: o.ease ?? 'back.out(1.6)',
      stagger: o.stagger ?? 0.09,
    },
    o.at ?? 0,
  );
}

/** Items turn in from the side around an axis far behind them, as if on a carousel. */
export function carouselIn(tl: gsap.core.Timeline, targets: Targets, o: At = {}) {
  return tl.from(
    targets,
    {
      rotationY: -70,
      z: -120,
      transformOrigin: '50% 50% -260px',
      transformPerspective: 900,
      opacity: 0,
      duration: o.duration ?? 1,
      ease: o.ease ?? 'expo.out',
      stagger: o.stagger ?? 0.12,
    },
    o.at ?? 0,
  );
}

/** Flips over from its back, like a coin or a record sleeve. */
export function flipIn(tl: gsap.core.Timeline, targets: Targets, o: At = {}) {
  return tl.from(
    targets,
    {
      rotationY: -180,
      transformPerspective: 800,
      duration: o.duration ?? 0.9,
      ease: o.ease ?? 'back.out(1.4)',
      stagger: o.stagger ?? 0.1,
    },
    o.at ?? 0,
  );
}

/** Rises from deep inside the screen and tilts upright. */
export function riseIn(tl: gsap.core.Timeline, targets: Targets, o: At = {}) {
  return tl.from(
    targets,
    {
      z: -600,
      rotationX: 35,
      transformPerspective: 900,
      opacity: 0,
      duration: o.duration ?? 1.1,
      ease: o.ease ?? 'expo.out',
      stagger: o.stagger ?? 0.1,
    },
    o.at ?? 0,
  );
}

/** A tilted plane that rolls up and lies flat, like opening credits. */
export function creditsIn(tl: gsap.core.Timeline, targets: Targets, o: At = {}) {
  return tl.from(
    targets,
    {
      rotationX: 55,
      y: '12cqw',
      z: -200,
      transformOrigin: '50% 100%',
      transformPerspective: 600,
      opacity: 0,
      duration: o.duration ?? 1.4,
      ease: o.ease ?? 'expo.out',
      stagger: o.stagger ?? 0.12,
    },
    o.at ?? 0,
  );
}

/** Slams down from above the paper, like a rubber stamp. */
export function stampIn(tl: gsap.core.Timeline, targets: Targets, o: At = {}) {
  return tl.from(
    targets,
    {
      z: 420,
      rotationX: -28,
      rotationY: 18,
      transformPerspective: 700,
      opacity: 0,
      duration: o.duration ?? 0.42,
      ease: o.ease ?? 'power4.in',
    },
    o.at ?? 0,
  );
}
