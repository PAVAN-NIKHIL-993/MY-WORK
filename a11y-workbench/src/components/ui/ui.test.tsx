/**
 * Primitive component tests.
 *
 * Focus is behaviour that is easy to regress and impossible to see in a
 * screenshot: label association, focus handling, keyboard traps, live-region
 * semantics and the icon-only labelling contract.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { Field } from './Field';
import { Modal } from './Modal';
import { Badge, SeverityBadge, StatusBadge } from './Badge';
import { Alert, EmptyState, PageHeader, Skeleton } from './Feedback';
import { Card, CardHeader } from './Card';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form implicitly', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('renders an icon-only button with an accessible name', () => {
    render(<Button iconOnly icon="trash" aria-label="Delete scan" />);
    const button = screen.getByRole('button', { name: 'Delete scan' });
    expect(button).toHaveClass('button--icon');
  });

  it('fires onClick when activated by keyboard', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Run</Button>);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Run
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Run' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Field', () => {
  it('associates the label with the input', () => {
    render(
      <Field id="name" label="Project name" required>
        {(props) => <input {...props} type="text" />}
      </Field>,
    );
    const input = screen.getByLabelText(/Project name/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('id', 'name');
  });

  it('links hint and error text through aria-describedby and marks the field invalid', () => {
    render(
      <Field id="email" label="Email" hint="Work address" error="Email is required">
        {(props) => <input {...props} type="email" />}
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby')!;
    expect(describedBy).toContain('email-hint');
    expect(describedBy).toContain('email-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('omits aria-invalid when there is no error', () => {
    render(
      <Field id="ok" label="Ok">
        {(props) => <input {...props} />}
      </Field>,
    );
    expect(screen.getByLabelText('Ok')).not.toHaveAttribute('aria-invalid');
  });
});

describe('Modal', () => {
  it('exposes dialog semantics with a title and description', () => {
    render(
      <Modal title="New project" description="Groups pages" onClose={() => {}}>
        <p>body</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('New project');
    expect(dialog).toHaveAccessibleDescription('Groups pages');
  });

  it('closes on Escape and on the close button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="Dialog" onClose={onClose}>
        <button type="button">Inner</button>
      </Modal>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('traps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    render(
      <Modal
        title="Trap"
        onClose={() => {}}
        footer={
          <>
            <button type="button">Cancel</button>
            <button type="button">Confirm</button>
          </>
        }
      >
        <p>content</p>
      </Modal>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
    await user.tab();
    await user.tab();
    // Cycles back to the first focusable element rather than leaving the dialog.
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  it('moves focus to the first control on open', () => {
    render(
      <Modal title="Focus" onClose={() => {}}>
        <button type="button">First</button>
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  it('locks background scrolling while open', () => {
    const { unmount } = render(
      <Modal title="Scroll" onClose={() => {}}>
        <p>x</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});

describe('Badges', () => {
  it('always include a text label, never colour alone', () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('render status wording from the shared label map', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('supports a neutral badge', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toHaveClass('badge');
  });
});

describe('Feedback primitives', () => {
  it('Alert uses role=alert only when live', () => {
    const { rerender } = render(<Alert tone="error">Boom</Alert>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    rerender(
      <Alert tone="error" live>
        Boom
      </Alert>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
  });

  it('Skeleton announces a busy status', () => {
    render(<Skeleton label="Loading findings" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading findings');
  });

  it('EmptyState renders a heading-like title and optional actions', () => {
    render(
      <EmptyState title="Nothing here" body="Add something" actions={<button type="button">Add</button>} />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('PageHeader renders a single h1', () => {
    render(<PageHeader title="Reports" description="All reports" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('links a section to its heading for landmark naming', () => {
    render(
      <Card ariaLabelledBy="card-title">
        <CardHeader title="Scans" titleId="card-title" />
        <p>body</p>
      </Card>,
    );
    expect(screen.getByRole('region', { name: 'Scans' })).toBeInTheDocument();
  });
});
