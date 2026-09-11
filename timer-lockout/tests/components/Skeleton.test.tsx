import { render, screen } from '@testing-library/react';
import Skeleton from '@/components/Skeleton';

describe('Skeleton Component', () => {
  it('should render with default rectangular variant', () => {
    render(<Skeleton />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-secondary-200', 'rounded', 'animate-pulse');
  });

  it('should render with text variant', () => {
    render(<Skeleton variant="text" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-4', 'rounded');
  });

  it('should render with circular variant', () => {
    render(<Skeleton variant="circular" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('should apply custom className', () => {
    render(<Skeleton className="custom-class" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('should apply custom width and height', () => {
    render(<Skeleton width="100px" height="50px" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
  });

  it('should have aria-hidden attribute', () => {
    render(<Skeleton />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  describe('Skeleton.Card', () => {
    it('should render card skeleton', () => {
      render(<Skeleton.Card />);
      const card = screen.getByTestId('skeleton-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('card', 'p-6');
    });

    it('should apply custom className to card', () => {
      render(<Skeleton.Card className="custom-card" />);
      const card = screen.getByTestId('skeleton-card');
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('Skeleton.Button', () => {
    it('should render button skeleton', () => {
      render(<Skeleton.Button />);
      const button = screen.getByTestId('skeleton-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('inline-flex', 'bg-secondary-200', 'animate-pulse');
    });

    it('should apply custom className to button', () => {
      render(<Skeleton.Button className="custom-button" />);
      const button = screen.getByTestId('skeleton-button');
      expect(button).toHaveClass('custom-button');
    });
  });
});
