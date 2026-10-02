'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cardToPngBlob } from '@/share/capture';
import { EXPORT_SIZE } from './constants';
import { Slide } from './Slide';
import { themeStyle, type Backdrop, type ThemeTokens } from './themes';

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Renders one card a second time, off-screen, in a real 1080 × 1920 box and in
 * its final, still state, then captures it. (html-to-image inlines computed
 * styles, so the on-screen card can't simply be "resized" for the export.)
 */
export function ExportStage({
  theme,
  backdrop,
  seed,
  children,
  onDone,
}: {
  theme: ThemeTokens;
  backdrop: Backdrop;
  seed: number;
  children: ReactNode;
  onDone: (blob: Blob | null, error?: unknown) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await document.fonts?.ready;
        await nextFrame();
        await nextFrame();
        const node = ref.current?.querySelector<HTMLElement>('[data-card-surface]');
        if (!node) throw new Error('Nothing to export');
        const blob = await cardToPngBlob(node);
        if (!cancelled) done.current(blob);
      } catch (e) {
        if (!cancelled) done.current(null, e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return createPortal(
    <div
      ref={ref}
      aria-hidden
      inert
      data-theme={theme.id}
      style={{
        ...themeStyle(theme),
        position: 'fixed',
        left: -20000,
        top: 0,
        width: EXPORT_SIZE.width,
        height: EXPORT_SIZE.height,
        pointerEvents: 'none',
      }}
    >
      <Slide
        theme={theme}
        backdrop={backdrop}
        reduced
        seed={seed}
        direction={1}
        label="export"
        still
      >
        {children}
      </Slide>
    </div>,
    document.body,
  );
}
