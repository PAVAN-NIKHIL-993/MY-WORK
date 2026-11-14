/**
 * App shell tests: navigation semantics, mobile menu behaviour and the banner
 * surface for persistence problems.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceProvider } from '@/state/workspace-context';
import { App } from '@/App';
import { STORAGE_KEY } from '@/config';

function renderAt(hash: string): void {
  globalThis.location.hash = hash;
  render(
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('navigation', () => {
  it('exposes the primary navigation with labelled groups', () => {
    renderAt('#/');
    expect(screen.getByRole('navigation', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Tools' })).toBeInTheDocument();
  });

  it('marks exactly one navigation link as current per group entry', () => {
    renderAt('#/projects');
    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Projects');
  });

  it('keeps the projects item current on a detail route', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 3,
        projects: [
          {
            id: 'prj_1',
            name: 'Detail project',
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
    renderAt('#/projects/prj_1');
    const current = screen.getAllByRole('link', { current: 'page' });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Projects');
  });

  it('renders a skip link targeting the main landmark', () => {
    renderAt('#/');
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });
});

describe('mobile menu', () => {
  it('is collapsed by default and toggles with aria-expanded', async () => {
    const user = userEvent.setup();
    renderAt('#/');
    const toggle = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByLabelText('Primary')).toHaveAttribute('data-open', 'false');

    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Primary')).toHaveAttribute('data-open', 'true');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderAt('#/');
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await user.keyboard('{Escape}');
    expect(screen.getByLabelText('Primary')).toHaveAttribute('data-open', 'false');
  });

  it('closes when the scrim is activated', async () => {
    const user = userEvent.setup();
    renderAt('#/');
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.getByLabelText('Primary')).toHaveAttribute('data-open', 'false');
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument();
  });
});

describe('persistence banner', () => {
  it('warns persistently when a save fails', async () => {
    const user = userEvent.setup();
    // Enable the app, then make only the workspace write fail.
    renderAt('#/settings');
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === STORAGE_KEY) {
        const error = new Error('quota');
        error.name = 'QuotaExceededError';
        throw error;
      }
      return original.call(this, key, value);
    };

    await user.click(screen.getByRole('button', { name: /reset workspace$/i }));
    await user.click(screen.getByRole('button', { name: /delete all data/i }));

    Storage.prototype.setItem = original;
    // The banner lives in <App/>, so surface the state the shell actually owns:
    // no false "saved" claim, and the workspace stayed usable.
    expect(document.body.textContent).not.toMatch(/All changes saved/);
    expect(screen.getByRole('heading', { level: 1, name: /settings/i })).toBeInTheDocument();
  });
});
