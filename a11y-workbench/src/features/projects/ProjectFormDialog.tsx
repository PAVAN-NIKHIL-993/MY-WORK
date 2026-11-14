/**
 * Create / edit project dialog.
 *
 * Validation rules live in `storage/repository.ts` (`validateProjectInput`) and
 * are reused here, so the repository cannot accept data the form rejects and a
 * programmatic caller gets the same message as a user.
 */

import { useState, type FormEvent } from 'react';
import type { Project } from '@/types/domain';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { LIMITS } from '@/config';
import { validateProjectInput } from '@/storage/repository';

export function ProjectFormDialog({
  project,
  onClose,
  onSubmit,
}: {
  /** When provided the dialog edits instead of creates. */
  project?: Project;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string; owner: string }) => string | null;
}): JSX.Element {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [owner, setOwner] = useState(project?.owner ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(project);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (saving) return;

    // Validation messages attach to the field they belong to; only failures
    // that are not field-specific become a form-level alert (no duplicate text).
    const validation = validateProjectInput({ name, description, owner });
    if (validation) {
      setNameError(validation);
      return;
    }

    setSaving(true);
    const failure = onSubmit({ name: name.trim(), description: description.trim(), owner: owner.trim() });
    setSaving(false);
    if (failure) {
      setSaveError(failure);
      return;
    }
    onClose();
  }

  return (
    <Modal
      title={isEdit ? 'Edit project' : 'New project'}
      description={
        isEdit
          ? 'Update the project details. Scans and findings are not affected.'
          : 'A project groups every page of one product or site so findings and reports stay scoped.'
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="project-form" disabled={saving}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" className="stack" onSubmit={handleSubmit} noValidate>
        {saveError ? (
          <Alert tone="error" title="Project not saved" live>
            {saveError}
          </Alert>
        ) : null}

        <Field
          id="project-name"
          label="Project name"
          required
          hint={`Up to ${LIMITS.maxNameLength} characters.`}
          error={nameError}
        >
          {(props) => (
            <input
              {...props}
              className="input"
              type="text"
              value={name}
              maxLength={LIMITS.maxNameLength}
              autoComplete="off"
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) setNameError(null);
              }}
            />
          )}
        </Field>

        <Field id="project-owner" label="Owner" hint="Team or auditor responsible. Printed in reports.">
          {(props) => (
            <input
              {...props}
              className="input"
              type="text"
              value={owner}
              maxLength={120}
              autoComplete="off"
              onChange={(event) => setOwner(event.target.value)}
            />
          )}
        </Field>

        <Field id="project-description" label="Scope" hint="What this project covers, e.g. “Marketing site, template B”.">
          {(props) => (
            <textarea
              {...props}
              className="textarea"
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', minHeight: 88 }}
              value={description}
              maxLength={1000}
              onChange={(event) => setDescription(event.target.value)}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
