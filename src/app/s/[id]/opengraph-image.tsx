import { connection } from 'next/server';
import { getDb } from '@/server/db';
import { getShare } from '@/server/shares';
import { renderGenericImage, renderShareImage } from '@/share/og';

export const alt = 'A card from Life, Wrapped';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  // Rendered per request, so a deleted card's preview goes with it.
  await connection();
  const db = await getDb();
  const share = db ? await getShare(db, (await params).id) : null;
  return share ? renderShareImage(share.payload, share.isSample) : renderGenericImage();
}
