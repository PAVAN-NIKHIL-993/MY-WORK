/**
 * Settings: appearance, data management and operational limits.
 *
 * Data management is the critical surface: export a backup before destructive
 * actions, import a validated backup, or reset the workspace behind an explicit
 * confirmation. Limits are shown read-only so an auditor can see why a capture
 * was rejected instead of guessing.
 */

import { useRef, useState, type ChangeEvent } from 'react';
import { useWorkspace } from '@/state/workspace-context';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { PageHeader, Alert } from '@/components/ui/Feedback';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LIMITS, SCHEMA_VERSION, STORAGE_KEY, APP_VERSION } from '@/config';
import { ENGINE_VERSION } from '@/engine/audit';
import { RULE_DESCRIPTORS } from '@/engine/rules';
import { RULES } from '@/engine/rules';
import { parseBackup, serializeBackup } from '@/storage/backup';
import { downloadTextFile } from '@/lib/download';
import { formatBytes, pluralize } from '@/lib/format';

export function SettingsScreen(): JSX.Element {
  const { workspace, storedBytes, resetAll, restoreBackup, notify } = useWorkspace();
  const { mode, resolved, setMode } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport(): void {
    downloadTextFile(
      `a11y-workbench-backup-${new Date().toISOString().slice(0, 10)}.json`,
      serializeBackup(workspace),
      'application/json',
    );
    notify('success', 'Workspace backup downloaded.');
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => setImportError('The file could not be read. Try again.');
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const result = parseBackup(text);
      if (!result.ok || !result.workspace) {
        setImportError(result.message);
        return;
      }
      setImportError(null);
      const outcome = restoreBackup(result.workspace);
      if (outcome.persistence && !outcome.persistence.ok) {
        setImportError(outcome.persistence.message ?? 'The backup could not be saved.');
        return;
      }
      notify('success', result.message);
    };
    reader.readAsText(file);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Appearance, stored data and the operational limits this workspace runs with."
      />

      <div className="stack" style={{ maxWidth: 820 }}>
        <Card ariaLabelledBy="settings-theme-heading">
          <CardHeader
            title="Appearance"
            titleId="settings-theme-heading"
            subtitle={`Currently using the ${resolved} theme.`}
          />
          <CardBody>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="field-label" style={{ marginBottom: 'var(--space-2)' }}>
                Colour theme
              </legend>
              <div className="radio-cards">
                {(['system', 'light', 'dark'] as ThemeMode[]).map((option) => (
                  <label className="radio-card" key={option}>
                    <input
                      type="radio"
                      name="theme"
                      value={option}
                      checked={mode === option}
                      onChange={() => setMode(option)}
                    />
                    {option === 'system' ? 'Match system' : option === 'light' ? 'Light' : 'Dark'}
                  </label>
                ))}
              </div>
            </fieldset>
          </CardBody>
        </Card>

        <Card ariaLabelledBy="settings-data-heading">
          <CardHeader
            title="Workspace data"
            titleId="settings-data-heading"
            subtitle={`Stored in this browser only. ${formatBytes(storedBytes)} currently used.`}
          />
          <CardBody className="stack">
            <dl className="detail-grid">
              <dt>Projects</dt>
              <dd>{pluralize(workspace.projects.length, 'project')}</dd>
              <dt>Scans</dt>
              <dd>{pluralize(workspace.scans.length, 'scan')}</dd>
              <dt>Findings</dt>
              <dd>{pluralize(workspace.scans.flatMap((scan) => scan.findings).length, 'finding')}</dd>
              <dt>Schema version</dt>
              <dd>{workspace.schemaVersion} (current {SCHEMA_VERSION})</dd>
              <dt>Storage key</dt>
              <dd className="mono">{STORAGE_KEY}</dd>
            </dl>

            {importError ? (
              <Alert tone="error" title="Import failed" live>
                {importError}
              </Alert>
            ) : null}

            <div className="row">
              <Button icon="download" onClick={handleExport}>
                Export backup (JSON)
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                id="import-backup"
                onChange={handleImport}
              />
              <Button icon="upload" onClick={() => fileRef.current?.click()}>
                Restore backup
              </Button>
            </div>
            <p className="field-hint">
              A backup contains every project, scan and audit note. Restoring replaces the current
              workspace — export first if it holds work you still need.
            </p>

            <hr />

            <div>
              <h3 className="card-title" style={{ fontSize: 'var(--text-sm)' }}>
                Reset workspace
              </h3>
              <p className="field-hint" style={{ marginBottom: 'var(--space-2)' }}>
                Deletes every project, scan and finding from this browser. This cannot be undone.
              </p>
              {confirmReset ? (
                <Alert
                  tone="error"
                  title="This will delete everything"
                  actions={
                    <>
                      <Button size="sm" onClick={() => setConfirmReset(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          resetAll();
                          setConfirmReset(false);
                          notify('info', 'Workspace reset. All local audits were deleted.');
                        }}
                      >
                        Delete all data
                      </Button>
                    </>
                  }
                >
                  {pluralize(workspace.projects.length, 'project')} and{' '}
                  {pluralize(workspace.scans.length, 'scan')} will be permanently deleted.
                </Alert>
              ) : (
                <Button variant="danger" icon="trash" onClick={() => setConfirmReset(true)}>
                  Reset workspace
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        <Card ariaLabelledBy="settings-limits-heading">
          <CardHeader
            title="Operational limits"
            titleId="settings-limits-heading"
            subtitle="Configured at build time with VITE_* environment variables."
          />
          <CardBody>
            <dl className="detail-grid">
              <dt>Max capture size</dt>
              <dd>{formatBytes(LIMITS.maxCaptureBytes)}</dd>
              <dt>Max findings per scan</dt>
              <dd>{LIMITS.maxFindingsPerScan}</dd>
              <dt>Scans per project</dt>
              <dd>{LIMITS.maxScansPerProject}</dd>
              <dt>Max projects</dt>
              <dd>{LIMITS.maxProjects}</dd>
              <dt>Engine version</dt>
              <dd>{ENGINE_VERSION}</dd>
              <dt>Rules evaluated</dt>
              <dd>
                {RULES.length} ({RULE_DESCRIPTORS.length} descriptors)
              </dd>
              <dt>App version</dt>
              <dd>{APP_VERSION}</dd>
            </dl>
            <p className="field-hint" style={{ marginTop: 'var(--space-3)' }}>
              These limits protect the browser storage quota. Values are clamped to safe bounds, so
              an invalid environment value falls back to the default instead of disabling the app.
            </p>
          </CardBody>
        </Card>

        <Card ariaLabelledBy="settings-privacy-heading">
          <CardHeader title="Privacy and security" titleId="settings-privacy-heading" />
          <CardBody className="stack">
            <p className="text-sm text-secondary">
              Captured markup never leaves this browser: there is no server, no analytics and no
              third-party request. Parsing uses <code>DOMParser</code>, so scripts in captured markup
              do not execute and images are not fetched.
            </p>
            <p className="text-sm text-secondary">
              Data is stored unencrypted in <code>localStorage</code>, which is readable by anything
              running on this origin. Use a dedicated browser profile for confidential audits and
              export a backup before clearing site data.
            </p>
            <details>
              <summary className="text-sm" style={{ cursor: 'pointer', fontWeight: 600 }}>
                Download the raw workspace document
              </summary>
              <div className="stack-sm" style={{ marginTop: 'var(--space-2)' }}>
                <p className="field-hint">
                  Same content as a backup, without the wrapper. Useful when migrating storage by hand.
                </p>
                <Button
                  size="sm"
                  icon="download"
                  onClick={() => {
                    downloadTextFile('workspace-raw.json', JSON.stringify(workspace, null, 2), 'application/json');
                    notify('info', 'Raw workspace downloaded.');
                  }}
                >
                  Download raw JSON
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard?.writeText(serializeBackup(workspace));
                    notify('info', 'Backup copied to the clipboard.');
                  }}
                >
                  Copy backup to clipboard
                </Button>
              </div>
            </details>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
