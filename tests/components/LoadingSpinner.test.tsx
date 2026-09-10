import { render, screen } from '@testing-library/react';
import LoadingSpinner from '@/components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render with default size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8', 'border-4');
  });

  it('should render with small size', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status');
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveClass('w-6', 'h-6', 'border-2');
  });

  it('should render with large size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveClass('w-12', 'h-12', 'border-4');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    const svg = spinner.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('should have custom aria-label', () => {
    render(<LoadingSpinner label="Custom loading message" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Custom loading message');
  });

  it('should have default aria-label', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('should have hidden text for screen readers', () => {
    render(<LoadingSpinner label="Loading data" />);
    const hiddenText = screen.getByText('Loading data');
    expect(hiddenText).toHaveClass('sr-only');
  });
});
