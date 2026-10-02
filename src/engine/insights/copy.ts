// Small formatting helpers shared by insights' a11y text (worker side, no React).
const nf = new Intl.NumberFormat('en-US');
const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const dayFmt = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

export const n = (v: number) => nf.format(Math.round(v));
export const pct = (share: number) => `${Math.round(share * 100)}%`;
export const date = (d: string) => dateFmt.format(new Date(`${d}T00:00:00Z`));
export const day = (d: string) => dayFmt.format(new Date(`${d}T00:00:00Z`));
export const fmtRange = (a: string, b: string) => `${date(a)} to ${date(b)}`;

export function hour12(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  return `${hh % 12 === 0 ? 12 : hh % 12} ${hh < 12 ? 'AM' : 'PM'}`;
}

export function clock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = String(Math.round(minutes) % 60).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

export const listOf = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
