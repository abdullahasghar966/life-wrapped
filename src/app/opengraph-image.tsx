import { renderGenericImage } from '@/share/og';

export const alt =
  'Life, Wrapped: your whole online life, wrapped, without it ever leaving your device';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return renderGenericImage();
}
