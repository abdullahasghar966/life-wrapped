'use client';
import { forwardRef, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react';
import { useGSAP } from './gsap';
import { CardController, CardRuntimeProvider } from './runtime';
import { backdropStyle, type Backdrop, type ThemeTokens } from './themes';
import { enterSlide } from './transitions';

export interface SlideHandle {
  controller: CardController;
  surface: HTMLDivElement | null;
}

interface Props {
  theme: ThemeTokens;
  backdrop: Backdrop;
  reduced: boolean;
  seed: number;
  direction: 1 | -1;
  label: string;
  children: ReactNode;
  /** Render the final frame with no transition or animation (image export). */
  still?: boolean;
}

/**
 * One card: an accessible slide group, the theme backdrop, an entrance
 * transition, and a controller that owns every animation inside it.
 */
export const Slide = forwardRef<SlideHandle, Props>(function Slide(
  { theme, backdrop, reduced, seed, direction, label, children, still = false },
  ref,
) {
  const surface = useRef<HTMLDivElement>(null);
  const controller = useMemo(() => new CardController(), []);
  useImperativeHandle(
    ref,
    () => ({
      controller,
      get surface() {
        return surface.current;
      },
    }),
    [controller],
  );

  useGSAP(
    () => {
      if (!surface.current || still) return;
      const anim = enterSlide(surface.current, theme.id, direction, reduced);
      controller.add(anim);
    },
    { scope: surface, dependencies: [] },
  );

  const runtime = useMemo(
    () => ({ controller, theme, reduced: reduced || still, seed }),
    [controller, theme, reduced, still, seed],
  );

  return (
    <div role="group" aria-roledescription="slide" aria-label={label} className="absolute inset-0">
      <div
        ref={surface}
        data-card-surface
        style={backdropStyle(backdrop)}
        className="t-body [container-type:size] absolute inset-0 overflow-hidden text-(--c-ink)"
      >
        {theme.id === 'sound' ? (
          <div
            data-wipe
            aria-hidden
            className="absolute top-1/2 left-1/2 size-[300cqmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--c-bg)"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-(--c-bg)" />
        )}
        <div data-card-content className="absolute inset-0">
          <CardRuntimeProvider value={runtime}>{children}</CardRuntimeProvider>
        </div>
      </div>
    </div>
  );
});
