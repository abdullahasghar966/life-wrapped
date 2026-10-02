/** How long each card stays up before auto-advancing (§11). Summary cards don't auto-advance. */
export const CARD_MS = 7000;
/** Press longer than this and it's a hold (pause), not a tap. */
export const HOLD_MS = 220;
/** A downward drag longer than this closes the story on touch screens. */
export const SWIPE_CLOSE_PX = 90;
/** Exported images are always 1080 × 1920 (9:16). */
export const EXPORT_SIZE = { width: 1080, height: 1920 } as const;
