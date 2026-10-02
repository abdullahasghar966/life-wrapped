'use client';
import { toBlob } from 'html-to-image';
import { EXPORT_SIZE } from '@/story/constants';

/** Captures an element that is already laid out at 1080 × 1920 (see ExportStage). */
export async function cardToPngBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    width: EXPORT_SIZE.width,
    height: EXPORT_SIZE.height,
    pixelRatio: 1,
    cacheBust: true,
  });
  if (!blob) throw new Error('Could not render the image');
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
