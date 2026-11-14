/**
 * Vitest global setup.
 *
 * jsdom gaps filled explicitly rather than mocked away per-test:
 *  - `matchMedia` (absent in jsdom, used by the theme hook);
 *  - `crypto.randomUUID` (present in Node 20+, kept for older runners);
 *  - `scrollTo` (no layout in jsdom);
 *  - `URL.createObjectURL` (used by export helpers; assertions check the call,
 *    not the download itself).
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

if (!globalThis.matchMedia) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!URL.createObjectURL) {
  Object.defineProperty(URL, 'createObjectURL', { writable: true, value: vi.fn(() => 'blob:mock') });
  Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() });
}

if (!globalThis.scrollTo) {
  Object.defineProperty(globalThis, 'scrollTo', { writable: true, value: vi.fn() });
}
