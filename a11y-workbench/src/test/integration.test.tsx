/**
 * Integration tests: real <App/> with the real store, engine and localStorage.
 *
 * These are the tests that prove the product works as a whole — the same code
 * path a user exercises — without mocking the engine, storage or router:
 *
 *   create project → capture page → audit → triage → report → persistence.
 *
 * jsdom has no layout engine, so `offsetParent`-dependent behaviour (focus trap
 * filtering) is exercised in the unit tests instead.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { WorkspaceProvider } from '@/state/workspace-context';
import { STORAGE_KEY } from '@/config';
import { SAMPLES } from '@/samples';

function renderApp(hash = '#/'): void {
  globalThis.location.hash = hash;
  render(
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  globalThis.location.hash = '#/';
});

describe('first run', () => {
  it('shows the onboarding state on the overview', () => {
    renderApp();
    expect(screen.getByRole('heading', { level: 1, name: /start your first accessibility audit/i })).toBeInTheDocument();
    const steps = screen.getAllByRole('listitem').filter((item) => item.classList.contains('step'));
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveTextContent('Create a project');
    expect(steps[1]).toHaveTextContent('Capture a page');
  });

  it('renders navigation with a single current page marker', () => {
    renderApp();
    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Overview');
  });

  it('provides a skip link as the first focusable element', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
  });
});

describe('create project → capture → findings', () => {
  it('creates a project and shows it in the list', async () => {
    const user = userEvent.setup();
    renderApp('#/projects');

    await user.click(screen.getByRole('button', { name: /create your first project/i }));
    await user.type(screen.getByLabelText(/Project name/), 'Acme Store');
    await user.type(screen.getByLabelText('Owner'), 'QA team');
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    expect(await screen.findByText('Acme Store')).toBeInTheDocument();
    expect(screen.getByText('No scans')).toBeInTheDocument();
  });

  it('rejects an empty project name with an accessible error', async () => {
    const user = userEvent.setup();
    renderApp('#/projects');
    await user.click(screen.getByRole('button', { name: /create your first project/i }));
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    expect(await screen.findByText('Project name is required.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Project name/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('captures a sample page, runs the audit and lists the findings', async () => {
    const user = userEvent.setup();
    renderApp('#/projects');

    await user.click(screen.getByRole('button', { name: /create your first project/i }));
    await user.type(screen.getByLabelText(/Project name/), 'Acme Store');
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    // Open the project.
    await user.click(await screen.findByRole('link', { name: /Acme Store/i }));
    await user.click(screen.getByRole('button', { name: /capture a page/i }));

    // Load the failing sample and run the audit.
    await user.click(screen.getByRole('button', { name: 'Failing page' }));
    await user.click(screen.getByRole('button', { name: /run audit/i }));

    // The scan detail screen opens with findings.
    expect(await screen.findByRole('heading', { level: 1, name: /common failures/i })).toBeInTheDocument();
    expect(screen.getByText(/Image is missing an alt attribute/i)).toBeInTheDocument();
    expect(screen.getByText(/Button has no accessible name/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument();
  });

  it('reports a clean page with an explicit pass state', async () => {
    const user = userEvent.setup();
    renderApp('#/projects');

    await user.click(screen.getByRole('button', { name: /create your first project/i }));
    await user.type(screen.getByLabelText(/Project name/), 'Clean site');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    await user.click(await screen.findByRole('link', { name: /Clean site/i }));
    await user.click(screen.getByRole('button', { name: /capture a page/i }));

    // The passing sample should produce no findings.
    await user.click(screen.getByRole('button', { name: 'Accessible page' }));
    await user.click(screen.getByRole('button', { name: /run audit/i }));

    expect(await screen.findByText(/passed every rule/i)).toBeInTheDocument();
  });

  it('validates an empty capture before running the engine', async () => {
    const user = userEvent.setup();
    renderApp('#/projects');
    await user.click(screen.getByRole('button', { name: /create your first project/i }));
    await user.type(screen.getByLabelText(/Project name/), 'Validation');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    await user.click(await screen.findByRole('link', { name: /Validation/i }));
    await user.click(screen.getByRole('button', { name: /capture a page/i }));
    await user.click(screen.getByRole('button', { name: /run audit/i }));
    expect(await screen.findByText(/Paste the page markup to audit/i)).toBeInTheDocument();
  });
});

describe('triage', () => {
  it('persists a status change to localStorage and reflects it in the UI', async () => {
    const user = userEvent.setup();
    renderApp('#/projects');
    await user.click(screen.getByRole('button', { name: /create your first project/i }));
    await user.type(screen.getByLabelText(/Project name/), 'Triage');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    await user.click(await screen.findByRole('link', { name: /Triage/i }));
    await user.click(screen.getByRole('button', { name: /capture a page/i }));
    await user.click(screen.getByRole('button', { name: 'Accessible page' }));
    await user.click(screen.getByRole('button', { name: /run audit/i }));
    await screen.findByText(/passed every rule/i);

    // Navigate to the global findings inbox (empty because the page passed).
    await user.click(screen.getByRole('link', { name: /^Findings/ }));
    expect(await screen.findByText(/No findings yet|Nothing needs work/i)).toBeInTheDocument();

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toContain('Triage');
  });
});

describe('persistence and routing', () => {
  it('restores projects from localStorage on reload', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 3,
        projects: [
          {
            id: 'prj_1',
            name: 'Restored project',
            description: '',
            owner: '',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        scans: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    renderApp('#/projects');
    expect(screen.getByText('Restored project')).toBeInTheDocument();
  });

  it('shows a repair banner for corrupt stored data', () => {
    localStorage.setItem(STORAGE_KEY, '{this is not json');
    renderApp('#/');
    expect(screen.getByText(/Stored workspace is not valid JSON/i)).toBeInTheDocument();
  });

  it('renders the not-found screen for an unknown route', () => {
    renderApp('#/does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to overview/i })).toBeInTheDocument();
  });

  it('renders the not-found screen for a deleted project id', () => {
    renderApp('#/projects/prj_missing');
    expect(screen.getByRole('heading', { level: 1, name: /not available/i })).toBeInTheDocument();
  });
});

describe('tool screens', () => {
  it('evaluates contrast from user input', async () => {
    const user = userEvent.setup();
    renderApp('#/contrast');
    const foreground = screen.getByLabelText(/Text colour/);
    await user.clear(foreground);
    await user.type(foreground, '#000000');
    const background = screen.getByLabelText(/Background colour/);
    await user.clear(background);
    await user.type(background, '#ffffff');
    expect(await screen.findByText('21.00')).toBeInTheDocument();
  });

  it('shows an inline error for an unparsable colour', async () => {
    const user = userEvent.setup();
    renderApp('#/contrast');
    const foreground = screen.getByLabelText(/Text colour/);
    await user.clear(foreground);
    await user.type(foreground, 'notacolour');
    expect(await screen.findByText(/Enter a valid CSS colour/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter two valid colours/i)).toBeInTheDocument();
  });

  it('lists every engine rule in the reference', () => {
    renderApp('#/rules');
    expect(screen.getAllByRole('article').length).toBeGreaterThan(10);
    expect(screen.getByText('image-alt')).toBeInTheDocument();
  });

  it('filters rules by search term', async () => {
    const user = userEvent.setup();
    renderApp('#/rules');
    await user.type(screen.getByLabelText(/Search rules/), 'contrast');
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(1);
    expect(within(articles[0]!).getByText('contrast-inline')).toBeInTheDocument();
  });

  it('shows storage limits on the settings screen', () => {
    renderApp('#/settings');
    expect(screen.getByText('Max capture size')).toBeInTheDocument();
    expect(screen.getAllByText(/KB|MB/).length).toBeGreaterThan(0);
  });
});

describe('sample data', () => {
  it('bundles a failing and a passing sample', () => {
    expect(SAMPLES).toHaveLength(2);
    expect(SAMPLES[0]!.markup).toContain('<html>');
    expect(SAMPLES[1]!.markup).toContain('lang="en"');
  });
});

describe('save failure surfacing', () => {
  it('shows a persistent, actionable banner when persistence fails', async () => {
    const user = userEvent.setup();
    renderApp('#/projects');

    // Allow the storage availability probe, fail only the workspace write.
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === STORAGE_KEY) {
        const error = new Error('quota');
        error.name = 'QuotaExceededError';
        throw error;
      }
      return original.call(this, key, value);
    };

    await user.click(screen.getByRole('button', { name: /create your first project/i }));
    await user.type(screen.getByLabelText(/Project name/), 'Unsaved project');
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    Storage.prototype.setItem = original;

    expect(await screen.findByText(/Changes are not being saved/i)).toBeInTheDocument();
    // Exactly one place explains the failure — no duplicate alert in the dialog.
    expect(
      screen.getAllByText(/Browser storage is full, so this change was not saved/i),
    ).toHaveLength(1);
    // The change is still visible in memory so the auditor can export it.
    expect(screen.getByText('Unsaved project')).toBeInTheDocument();
  });
});
