/**
 * The device's own share sheet (Web Share API). The browser hands the image or
 * link to the app the person picks (Instagram, Snapchat, WhatsApp, Messages…);
 * Life, Wrapped itself sends nothing anywhere. There are no platform logins or
 * APIs (ADR-037).
 */

export type ShareOutcome = 'shared' | 'cancelled' | 'failed';

type ShareNavigator = Pick<Navigator, 'share' | 'canShare'>;

const nav = (): Partial<ShareNavigator> | undefined =>
  typeof navigator === 'undefined' ? undefined : navigator;

/** Whether this browser can pass this file to another app. */
export function canShareFiles(files: File[], n = nav()): boolean {
  if (typeof n?.share !== 'function' || typeof n.canShare !== 'function') return false;
  try {
    return n.canShare({ files });
  } catch {
    return false;
  }
}

/** Whether this browser has a share sheet for links. */
export function canShareUrl(url: string, n = nav()): boolean {
  if (typeof n?.share !== 'function') return false;
  // Older Safari has share() but not canShare(); links are always supported there.
  if (typeof n.canShare !== 'function') return true;
  try {
    return n.canShare({ url });
  } catch {
    return false;
  }
}

/**
 * Opens the share sheet. Must run inside the click handler: browsers only allow
 * it straight after a user gesture, which is why the image is rendered first.
 */
export async function openShareSheet(data: ShareData, n = nav()): Promise<ShareOutcome> {
  if (typeof n?.share !== 'function') return 'failed';
  try {
    await n.share(data);
    return 'shared';
  } catch (e) {
    // AbortError: the person closed the sheet without picking an app.
    return e instanceof Error && e.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

export function cardImageName(insightId: string): string {
  return `life-wrapped-${insightId.replace('.', '-')}.png`;
}
