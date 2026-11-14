/**
 * Workspace backup (JSON export) and restore (JSON import).
 *
 * Backup files are the only supported way to move a workspace between browsers,
 * so the format is versioned and validated on import through the same migration
 * path used for `localStorage`.
 */

import type { Workspace } from '@/types/domain';
import { migrateWorkspace } from './schema';
import { LIMITS } from '@/config';

export interface BackupFile {
  app: 'a11y-workbench';
  exportedAt: string;
  workspace: Workspace;
}

export function createBackup(workspace: Workspace): BackupFile {
  return { app: 'a11y-workbench', exportedAt: new Date().toISOString(), workspace };
}

/** Serialised backup, pretty-printed so it is diff-able and reviewable. */
export function serializeBackup(workspace: Workspace): string {
  return JSON.stringify(createBackup(workspace), null, 2);
}

export interface ImportResult {
  ok: boolean;
  workspace?: Workspace;
  message: string;
}

/** Maximum accepted backup size; protects the tab from an accidental huge file. */
const MAX_BACKUP_CHARS = 40 * 1024 * 1024;

/** Parses and validates a backup file. Never throws. */
export function parseBackup(text: string): ImportResult {
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, message: 'The selected file is empty.' };
  }
  if (text.length > MAX_BACKUP_CHARS) {
    return { ok: false, message: 'The selected file is too large to be a workspace backup (limit 40 MB).' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      message: `The file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const candidate =
    typeof parsed === 'object' && parsed !== null && 'workspace' in parsed
      ? (parsed as { workspace: unknown }).workspace
      : parsed;

  const result = migrateWorkspace(candidate);
  if (result.reset) {
    return { ok: false, message: 'The file does not contain an a11y-workbench workspace.' };
  }
  if (result.workspace.projects.length > LIMITS.maxProjects) {
    return { ok: false, message: `The backup has more than ${LIMITS.maxProjects} projects.` };
  }

  return {
    ok: true,
    workspace: result.workspace,
    message:
      result.repairs.length > 0
        ? `Backup restored with ${result.repairs.length} repair(s): ${result.repairs.join(' ')}`
        : 'Backup restored.',
  };
}

/** Creates a downloadable JSON file in the browser without a server round-trip. */
export function downloadBackup(workspace: Workspace): void {
  const blob = new Blob([serializeBackup(workspace)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `a11y-workbench-backup-${stamp}.json`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so Safari has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
