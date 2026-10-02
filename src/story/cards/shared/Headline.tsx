'use client';
import { useRef, type CSSProperties, type ElementType } from 'react';
import { gsap, SplitText, useGSAP } from '../../gsap';
import { useCardRuntime } from '../../runtime';

const FONT_TIMEOUT_MS = 1200;

/** Wait for web fonts (so masks are measured on the real glyphs), but never for long. */
function fontsReady(): Promise<unknown> {
  return Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((r) => setTimeout(r, FONT_TIMEOUT_MS)),
  ]);
}

/**
 * A headline that rises into place, split by chars, words or lines with a mask.
 * Motion comes from the theme (bouncy, snappy or cinematic). Screen readers get
 * the plain text (SplitText sets aria-label); reduced motion skips the split.
 */
export function Headline({
  as: Tag = 'h2',
  children,
  split = 'words',
  delay = 0.1,
  className,
  style,
}: {
  as?: ElementType;
  children: string;
  split?: 'chars' | 'words' | 'lines';
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const { controller, reduced, theme } = useCardRuntime();

  useGSAP(
    (context) => {
      const el = ref.current;
      if (!el) return;
      if (reduced) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      let cancelled = false;
      let tl: gsap.core.Timeline | undefined;
      void fontsReady().then(() => {
        if (cancelled || !context.add) return;
        context.add(() => {
          SplitText.create(el, {
            type: split === 'lines' ? 'lines' : split === 'chars' ? 'words,chars' : 'words',
            mask: split,
            autoSplit: true,
            // Returning the timeline lets autoSplit rebuild it at the same progress.
            onSplit(self) {
              gsap.set(el, { autoAlpha: 1 });
              if (tl) controller.remove(tl);
              const targets =
                split === 'chars' ? self.chars : split === 'lines' ? self.lines : self.words;
              tl = gsap.timeline({ delay });
              tl.from(targets, {
                yPercent: 115,
                rotate: theme.id === 'sound' ? 6 : 0,
                transformOrigin: '0% 100%',
                duration: theme.motion.duration * 1.4,
                ease: theme.id === 'sound' ? 'back.out(1.7)' : theme.motion.ease,
                stagger: split === 'chars' ? 0.035 : theme.motion.stagger,
              });
              controller.add(tl);
              return tl;
            },
          });
        });
      });
      return () => {
        cancelled = true;
        if (tl) controller.remove(tl);
      };
    },
    { dependencies: [children, reduced] },
  );

  return (
    // Hidden only while it waits to be split; a still or reduced-motion card shows it at once.
    <Tag
      ref={ref}
      className={`t-display ${reduced ? '' : 't-reveal'} ${className ?? ''}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
