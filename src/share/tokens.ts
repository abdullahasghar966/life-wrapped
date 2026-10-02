'use client';

/**
 * Delete tokens for shares made in this browser. This is the only thing the app
 * ever writes to localStorage, and only after the user shares a card.
 */
const KEY = 'life-wrapped:share-tokens';

function read(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function write(map: Record<string, string>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable (private mode): the share still works, it just can't be deleted later */
  }
}

export function saveDeleteToken(id: string, token: string): void {
  write({ ...read(), [id]: token });
}

export function getDeleteToken(id: string): string | null {
  return read()[id] ?? null;
}

export function forgetDeleteToken(id: string): void {
  const map = read();
  delete map[id];
  write(map);
}
