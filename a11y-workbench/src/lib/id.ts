/**
 * Identifier generation.
 *
 * Uses `crypto.randomUUID` when available (all evergreen browsers, jsdom 26),
 * and falls back to a timestamp + random suffix so the app still works in
 * insecure contexts where `crypto.randomUUID` is undefined.
 */

let counter = 0;

export function createId(prefix: string): string {
  const uuid =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${(counter += 1).toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid.replace(/-/g, '').slice(0, 20)}`;
}
