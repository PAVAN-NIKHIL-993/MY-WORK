/**
 * Persistence adapter over `localStorage`.
 *
 * Why an adapter instead of calling `localStorage` from components:
 *  - one place knows the storage key and serialisation format;
 *  - all failure modes (unavailable storage, quota exceeded, corrupt JSON) are
 *    translated into typed results the UI can act on;
 *  - tests can run against the same code path with jsdom's implementation.
 *
 * Failure behaviour: nothing here throws. `load` returns `null` when there is no
 * readable document and `save` returns `{ ok: false, reason }` so the caller can
 * show a specific, actionable message (e.g. "free space by deleting scans").
 */

import type { Workspace } from '@/types/domain';
import { STORAGE_KEY } from '@/config';
import { emptyWorkspace, migrateWorkspace, type MigrationResult } from './schema';

export type SaveFailureReason = 'quota' | 'unavailable' | 'unknown';

export interface SaveResult {
  ok: boolean;
  reason?: SaveFailureReason;
  message?: string;
}

export interface LoadResult {
  workspace: Workspace;
  /** True when nothing was stored yet (first run). */
  fresh: boolean;
  repairs: string[];
  /** Persisted bytes, used by the settings screen. */
  bytes: number;
}

function getStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    // Probe: Safari private mode exposes localStorage but throws on write.
    const probe = '__a11y_workbench_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const name = error.name;
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota/i.test(error.message)
  );
}

/** Reads and repairs the stored workspace. Never throws. */
export function loadWorkspace(): LoadResult {
  const storage = getStorage();
  if (!storage) {
    return {
      workspace: emptyWorkspace(),
      fresh: true,
      repairs: ['Browser storage is unavailable; changes will not be saved after reload.'],
      bytes: 0,
    };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      workspace: emptyWorkspace(),
      fresh: true,
      repairs: ['Stored workspace could not be read; starting empty.'],
      bytes: 0,
    };
  }

  if (raw === null || raw === '') {
    return { workspace: emptyWorkspace(), fresh: true, repairs: [], bytes: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      workspace: emptyWorkspace(),
      fresh: false,
      repairs: ['Stored workspace is not valid JSON and was reset. Export a backup regularly.'],
      bytes: raw.length,
    };
  }

  const result: MigrationResult = migrateWorkspace(parsed);
  if (result.reset) {
    return {
      workspace: emptyWorkspace(),
      fresh: false,
      repairs: [
        ...result.repairs,
        'Stored workspace had an unrecognised structure and was reset.',
      ],
      bytes: raw.length,
    };
  }

  return { workspace: result.workspace, fresh: false, repairs: result.repairs, bytes: raw.length };
}

/** Serialises and writes the workspace. Never throws. */
export function saveWorkspace(workspace: Workspace): SaveResult {
  const storage = getStorage();
  if (!storage) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Browser storage is unavailable, so this change was not saved. Keep this tab open or allow site data.',
    };
  }

  let payload: string;
  try {
    payload = JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() });
  } catch {
    return { ok: false, reason: 'unknown', message: 'Workspace could not be serialised.' };
  }

  try {
    storage.setItem(STORAGE_KEY, payload);
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      return {
        ok: false,
        reason: 'quota',
        message:
          'Browser storage is full, so this change was not saved. Export a backup, then delete old scans or projects.',
      };
    }
    return {
      ok: false,
      reason: 'unknown',
      message: `Saving failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** Removes the persisted workspace (used by "reset workspace"). */
export function clearWorkspace(): SaveResult {
  const storage = getStorage();
  if (!storage) return { ok: false, reason: 'unavailable', message: 'Browser storage is unavailable.' };
  try {
    storage.removeItem(STORAGE_KEY);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: 'unknown',
      message: `Could not clear storage: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** Rough size of the stored document, for the settings screen. */
export function measureStoredBytes(): number {
  const storage = getStorage();
  if (!storage) return 0;
  try {
    return (storage.getItem(STORAGE_KEY) ?? '').length;
  } catch {
    return 0;
  }
}
