import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws an error
const ErrorComponent: React.FC = () => {
  throw new Error('Test error');
};

// Component that renders normally
const NormalComponent: React.FC = () => {
  return <div>Normal content</div>;
};

describe('ErrorBoundary Component', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();

    console.error = originalError;
  });

  it('should display custom fallback when provided', () => {
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();

    console.error = originalError;
  });

  it('should display error details in expandable section', () => {
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    const details = screen.getByText('Technical Details');
    expect(details).toBeInTheDocument();

    console.error = originalError;
  });

  it('should have correct accessibility attributes', () => {
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();

    console.error = originalError;
  });
});
