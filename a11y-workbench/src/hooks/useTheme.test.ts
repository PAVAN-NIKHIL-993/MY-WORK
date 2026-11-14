import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTheme, applyTheme } from './useTheme';
import { THEME_KEY } from '@/config';

describe('applyTheme', () => {
  it('writes the resolved theme to the document element', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('resolves "system" through prefers-color-scheme (light in jsdom)', () => {
    applyTheme('system');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('useTheme', () => {
  it('defaults to system and persists an explicit choice', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('system');

    act(() => result.current.setMode('dark'));
    expect(result.current.mode).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('clears the stored value when returning to system', () => {
    localStorage.setItem(THEME_KEY, 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('light');

    act(() => result.current.setMode('system'));
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it('survives a storage write failure', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('blocked');
    };
    const { result } = renderHook(() => useTheme());
    expect(() => act(() => result.current.setMode('dark'))).not.toThrow();
    expect(result.current.mode).toBe('dark');
    Storage.prototype.setItem = original;
  });
});
