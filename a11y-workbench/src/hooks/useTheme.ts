/**
 * Theme preference (light / dark / system) with persistence.
 *
 * Stored under a key separate from the workspace so a workspace reset does not
 * throw the user back into a theme they did not choose. The initial value is
 * applied by `src/lib/theme-init.ts` before React boots to avoid a flash.
 */

import { useCallback, useEffect, useState } from 'react';
import { THEME_KEY } from '@/config';

export type ThemeMode = 'light' | 'dark' | 'system';

function readStored(): ThemeMode {
  try {
    const value = globalThis.localStorage?.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/** Applies the resolved theme to `<html data-theme>`, which CSS keys off. */
export function applyTheme(mode: ThemeMode): void {
  const resolved = mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode;
  const root = globalThis.document?.documentElement;
  if (!root) return;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function useTheme(): { mode: ThemeMode; resolved: 'light' | 'dark'; setMode: (mode: ThemeMode) => void } {
  const [mode, setModeState] = useState<ThemeMode>(readStored);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    (readStored() === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : readStored()) as 'light' | 'dark',
  );

  useEffect(() => {
    applyTheme(mode);
    setResolved(mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode);

    if (mode !== 'system' || !globalThis.matchMedia) return;
    const media = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyTheme('system');
      setResolved(media.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      if (next === 'system') globalThis.localStorage?.removeItem(THEME_KEY);
      else globalThis.localStorage?.setItem(THEME_KEY, next);
    } catch {
      // Preference persistence is best-effort; the session still works.
    }
  }, []);

  return { mode, resolved, setMode };
}
