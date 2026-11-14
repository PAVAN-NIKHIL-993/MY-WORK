/**
 * Capture dialog — the primary data-entry workflow.
 *
 * Flow: pick project → name the capture → optional URL/template → paste markup
 * (or load a sample) → save, which runs the audit synchronously and stores the
 * scan. Validation happens before the engine runs so a too-large payload never
 * blocks the UI, and the character/byte budget is shown live so the limit is
 * never a surprise.
 */

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { LIMITS } from '@/config';
import { useWorkspace } from '@/state/workspace-context';
import { SAMPLES } from '@/samples';
import { byteLength, formatBytes } from '@/lib/format';
import { validateScanInput } from '@/storage/repository';

export function CaptureDialog({
  projectId,
  onClose,
  onCaptured,
}: {
  /** Preselected project; the user can still change it. */
  projectId?: string;
  onClose: () => void;
  onCaptured: (scanId: string, warnings: string[]) => void;
}): JSX.Element {
  const { workspace, addScan } = useWorkspace();
  const [selectedProject, setSelectedProject] = useState(
    projectId ?? workspace.projects[0]?.id ?? '',
  );
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [template, setTemplate] = useState('');
  const [markup, setMarkup] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bytes = useMemo(() => byteLength(markup), [markup]);
  const overLimit = bytes > LIMITS.maxCaptureBytes;

  function handleFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > LIMITS.maxCaptureBytes) {
      setError(`That file is ${formatBytes(file.size)}; the limit is ${formatBytes(LIMITS.maxCaptureBytes)}.`);
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError('The file could not be read. Try again or paste the markup.');
    reader.onload = () => {
      setMarkup(typeof reader.result === 'string' ? reader.result : '');
      setError(null);
      if (!name) setName(file.name.replace(/\.(html?|txt)$/i, ''));
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const input = {
      projectId: selectedProject,
      name: name.trim() === '' ? defaultName() : name,
      url,
      template,
      markup,
    };

    const validation = validateScanInput(workspace, input);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    const outcome = addScan(input);
    if (!outcome.scan) {
      setError(outcome.warnings?.[0] ?? 'The scan could not be created.');
      return;
    }
    // Persistence failures are surfaced by the app-wide banner; the scan still
    // opens so the auditor can review it and export before retrying.
    if (outcome.persistence && !outcome.persistence.ok) {
      onCaptured(outcome.scan.id, [...(outcome.warnings ?? []), 'Scan is in memory only — saving failed.']);
      onClose();
      return;
    }
    onCaptured(outcome.scan.id, outcome.warnings ?? []);
    onClose();
  }

  function defaultName(): string {
    const sample = SAMPLES.find((item) => item.markup === markup);
    if (sample) return sample.name;
    try {
      const host = url ? new URL(url).hostname : '';
      return host ? `Scan of ${host}` : 'Untitled capture';
    } catch {
      return 'Untitled capture';
    }
  }

  return (
    <Modal
      wide
      title="Capture a page"
      description="Paste the page HTML exactly as rendered. Markup is parsed in a sandboxed document: scripts never run and no network request is made."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="capture-form" icon="sparkle" disabled={overLimit}>
            Run audit
          </Button>
        </>
      }
    >
      <form id="capture-form" className="stack" onSubmit={handleSubmit} noValidate>
        {error ? (
          <Alert tone="error" title="Capture not saved" live>
            {error}
          </Alert>
        ) : null}

        {workspace.projects.length > 1 ? (
          <Field id="capture-project" label="Project" required>
            {(props) => (
              <select
                {...props}
                className="select"
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
              >
                {workspace.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : null}

        <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Field id="capture-name" label="Capture name" hint="Defaults to the page host or sample name.">
            {(props) => (
              <input
                {...props}
                className="input"
                type="text"
                value={name}
                maxLength={LIMITS.maxNameLength}
                placeholder="Checkout — payment step"
                onChange={(event) => setName(event.target.value)}
              />
            )}
          </Field>
          <Field id="capture-template" label="Template" hint="Optional grouping used in reports.">
            {(props) => (
              <input
                {...props}
                className="input"
                type="text"
                value={template}
                maxLength={120}
                placeholder="Product detail"
                onChange={(event) => setTemplate(event.target.value)}
              />
            )}
          </Field>
        </div>

        <Field id="capture-url" label="Page URL or environment" hint="Optional. Stored as evidence metadata.">
          {(props) => (
            <input
              {...props}
              className="input"
              type="text"
              inputMode="url"
              value={url}
              maxLength={LIMITS.maxUrlLength}
              placeholder="https://example.com/checkout"
              onChange={(event) => setUrl(event.target.value)}
            />
          )}
        </Field>

        <Field
          id="capture-markup"
          label="Page markup"
          required
          hint={`${formatBytes(bytes)} of ${formatBytes(LIMITS.maxCaptureBytes)} used. Include <!doctype html> for accurate parsing.`}
          error={overLimit ? 'Markup exceeds the capture limit. Trim the page or raise VITE_MAX_CAPTURE_KB.' : null}
        >
          {(props) => (
            <textarea
              {...props}
              className="textarea"
              value={markup}
              spellCheck={false}
              placeholder="<!doctype html><html lang=&quot;en&quot;>…"
              onChange={(event) => {
                setMarkup(event.target.value);
                if (error) setError(null);
              }}
            />
          )}
        </Field>

        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.txt,text/html,text/plain"
            className="visually-hidden"
            id="capture-file"
            onChange={handleFile}
          />
          <Button size="sm" icon="upload" onClick={() => fileInputRef.current?.click()}>
            Load HTML file
          </Button>
          <span className="text-xs text-muted">or try a sample:</span>
          {SAMPLES.map((sample) => (
            <Button
              key={sample.id}
              size="sm"
              variant="ghost"
              onClick={() => {
                setMarkup(sample.markup);
                setName(sample.name);
                setError(null);
              }}
            >
              {sample.id === 'sample-failing' ? 'Failing page' : 'Accessible page'}
            </Button>
          ))}
        </div>
      </form>
    </Modal>
  );
}
