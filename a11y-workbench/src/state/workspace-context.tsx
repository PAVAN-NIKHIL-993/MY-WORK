/**
 * Workspace state provider.
 *
 * Architecture: a single reducer-like store (workspace + persistence status +
 * toast queue) exposed through context. Chosen over an external state library
 * because the app has exactly one store and the write path is already
 * centralised in `storage/repository.ts`; adding a dependency would not remove
 * any code, only rename it.
 *
 * Loading behaviour: the stored workspace is read synchronously during the
 * first render (localStorage is synchronous), so there is no flicker between an
 * "empty" and a "loaded" workspace. `ready` is still exposed because the UI
 * shows a boot skeleton while fonts/layout settle and because a future async
 * store must not change component contracts.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { FindingStatus, Workspace } from '@/types/domain';
import { loadWorkspace, clearWorkspace, measureStoredBytes } from '@/storage/local-store';
import {
  bulkUpdateFindings,
  createProject,
  createScan,
  deleteProject,
  deleteScan,
  replaceWorkspace,
  resetWorkspace as buildEmptyWorkspace,
  updateFinding,
  updateProject,
  type CreateProjectInput,
  type CreateScanInput,
  type MutationOutcome,
} from '@/storage/repository';
import type { Scan } from '@/types/domain';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  /** Optional follow-up action, e.g. undo. */
  action?: { label: string; run: () => void };
}

export interface WorkspaceContextValue {
  workspace: Workspace;
  ready: boolean;
  /** Repairs or warnings produced while loading persisted data. */
  loadWarnings: string[];
  /** True when the last write failed; the UI shows a persistent banner. */
  persistenceError: string | null;
  storedBytes: number;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  notify: (tone: ToastTone, message: string, action?: Toast['action']) => void;
  addProject: (input: CreateProjectInput) => MutationOutcome;
  editProject: (projectId: string, patch: Partial<Pick<CreateProjectInput, 'name' | 'description' | 'owner'>>) => MutationOutcome;
  removeProject: (projectId: string) => MutationOutcome;
  addScan: (input: CreateScanInput) => MutationOutcome & { scan?: Scan; warnings?: string[] };
  removeScan: (scanId: string) => MutationOutcome;
  setFindingStatus: (scanId: string, findingId: string, status: FindingStatus, note?: string) => MutationOutcome;
  setFindingNote: (scanId: string, findingId: string, note: string) => MutationOutcome;
  bulkSetFindings: (scanId: string, findingIds: readonly string[], status: FindingStatus) => MutationOutcome;
  restoreBackup: (workspace: Workspace) => MutationOutcome;
  resetAll: () => void;
  refreshStoredBytes: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

let toastCounter = 0;

export function WorkspaceProvider({ children }: { children: ReactNode }): JSX.Element {
  const initial = useMemo(() => loadWorkspace(), []);
  const [workspace, setWorkspace] = useState<Workspace>(initial.workspace);
  const [loadWarnings, setLoadWarnings] = useState<string[]>(initial.repairs);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [storedBytes, setStoredBytes] = useState<number>(initial.bytes);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ready, setReady] = useState(false);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    setReady(true);
    const timersAtMount = timers.current;
    return () => {
      for (const timer of timersAtMount.values()) clearTimeout(timer);
      timersAtMount.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (tone: ToastTone, message: string, action?: Toast['action']) => {
      toastCounter += 1;
      const id = `toast_${toastCounter}`;
      setToasts((current) => [...current.slice(-3), { id, tone, message, ...(action ? { action } : {}) }]);
      const timer = setTimeout(() => dismissToast(id), tone === 'error' ? 9000 : 6000);
      timers.current.set(id, timer);
    },
    [dismissToast],
  );

  /**
   * Applies a mutation result: updates state, surfaces persistence failures and
   * refreshes the stored byte count. Centralised so no mutation path can forget
   * to report a failed save.
   */
  const apply = useCallback(
    (outcome: MutationOutcome): MutationOutcome => {
      setWorkspace(outcome.workspace);
      if (outcome.persistence && !outcome.persistence.ok) {
        setPersistenceError(outcome.persistence.message ?? 'Changes could not be saved.');
      } else {
        setPersistenceError(null);
      }
      setStoredBytes(measureStoredBytes());
      return outcome;
    },
    [],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      ready,
      loadWarnings,
      persistenceError,
      storedBytes,
      toasts,
      dismissToast,
      notify,
      addProject: (input) => apply(createProject(workspace, input)),
      editProject: (projectId, patch) => apply(updateProject(workspace, projectId, patch)),
      removeProject: (projectId) => apply(deleteProject(workspace, projectId)),
      addScan: (input) => {
        const outcome = createScan(workspace, input);
        apply(outcome);
        return outcome;
      },
      removeScan: (scanId) => apply(deleteScan(workspace, scanId)),
      setFindingStatus: (scanId, findingId, status, note) =>
        apply(updateFinding(workspace, scanId, findingId, { status, ...(note !== undefined ? { note } : {}) })),
      setFindingNote: (scanId, findingId, note) =>
        apply(updateFinding(workspace, scanId, findingId, { note })),
      bulkSetFindings: (scanId, findingIds, status) =>
        apply(bulkUpdateFindings(workspace, scanId, findingIds, status)),
      restoreBackup: (next) => apply(replaceWorkspace(next)),
      resetAll: () => {
        clearWorkspace();
        const empty = buildEmptyWorkspace();
        setWorkspace(empty);
        setPersistenceError(null);
        setStoredBytes(0);
        setLoadWarnings([]);
      },
      refreshStoredBytes: () => setStoredBytes(measureStoredBytes()),
    }),
    [workspace, ready, loadWarnings, persistenceError, storedBytes, toasts, dismissToast, notify, apply],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside <WorkspaceProvider>.');
  return context;
}
