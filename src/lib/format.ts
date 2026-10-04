const nf = new Intl.NumberFormat('en-US');
const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export const fmtInt = (n: number) => nf.format(Math.round(n));
export const fmt1 = (n: number) => nf1.format(n);
export const fmtPct = (share: number) => `${Math.round(share * 100)}%`;

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const dayMonthFmt = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});
const shortDayMonthFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' });

/** Formats a local YYYY-MM-DD date without re-applying any time zone. */
export const fmtDate = (d: string) => dateFmt.format(new Date(`${d}T00:00:00Z`));
export const fmtDayMonth = (d: string) => dayMonthFmt.format(new Date(`${d}T00:00:00Z`));
export const fmtShortDayMonth = (d: string) => shortDayMonthFmt.format(new Date(`${d}T00:00:00Z`));
export const fmtWeekday = (d: string) => weekdayFmt.format(new Date(`${d}T00:00:00Z`));

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** 0–23 → "1 AM", "12 PM"… */
export function fmtHour(h: number): string {
  const hour = ((h % 24) + 24) % 24;
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${suffix}`;
}

/** Minutes since local midnight → "3:12 AM". */
export function fmtClock(minutes: number): string {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60) % 24;
  const mm = String(m % 60).padStart(2, '0');
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${suffix}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${fmtInt(n)} ${n === 1 ? one : many}`;
}

/**
 * Real exports carry long names (100-character video titles are common). Headlines
 * get them shortened at a word boundary; lists and a11y text keep the full name.
 * Counts code points, so an emoji is never cut in half.
 */
export function shorten(text: string, max = 30): string {
  const chars = Array.from(text.trim());
  if (chars.length <= max) return text.trim();
  const cut = chars.slice(0, max - 1).join('');
  const space = cut.lastIndexOf(' ');
  const base = space > max / 2 ? cut.slice(0, space) : cut;
  return `${base.replace(/[\s,.;:!?|–—([{“"'-]+$/u, '')}…`;
}

/** Whether a name is long enough to need the smaller of two display sizes. */
export const isLongName = (text: string, max = 22) => Array.from(text).length > max;
