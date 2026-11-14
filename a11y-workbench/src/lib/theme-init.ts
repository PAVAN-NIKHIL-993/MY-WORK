/**
 * Boot-time theme application.
 *
 * Imported for its side effect by `main.tsx` before the first render, so the
 * correct theme is on `<html>` at first paint and there is no light/dark flash.
 * Kept tiny and dependency-free because it runs on the critical path.
 */

import { THEME_KEY } from '@/config';

function boot(): void {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_KEY);
    const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const resolved = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch {
    document.documentElement.dataset.theme = 'light';
  }
}

boot();
