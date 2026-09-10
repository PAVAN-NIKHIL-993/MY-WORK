import { render, screen } from '@testing-library/react';
import { TimerDisplay } from '@/components/TimerDisplay';
import type { TimerStatus } from '@/types';

describe('TimerDisplay Component', () => {
  it('should render with time value', () => {
    render(<TimerDisplay time={180} status="idle" />);
    expect(screen.getByTestId('timer-value')).toHaveTextContent('3:00');
  });

  it('should display correct time for 180 seconds', () => {
    render(<TimerDisplay time={180} status="idle" />);
    expect(screen.getByTestId('timer-value')).toHaveTextContent('3:00');
  });

  it('should display correct time for 60 seconds', () => {
    render(<TimerDisplay time={60} status="idle" />);
    expect(screen.getByTestId('timer-value')).toHaveTextContent('1:00');
  });

  it('should display correct time for 0 seconds', () => {
    render(<TimerDisplay time={0} status="idle" />);
    expect(screen.getByTestId('timer-value')).toHaveTextContent('0:00');
  });

  it('should display correct time for 150 seconds', () => {
    render(<TimerDisplay time={150} status="idle" />);
    expect(screen.getByTestId('timer-value')).toHaveTextContent('2:30');
  });

  it('should show lockout message when status is locked', () => {
    render(<TimerDisplay time={0} status="locked" />);
    expect(screen.getByTestId('lockout-message')).toBeInTheDocument();
    expect(screen.getByTestId('lockout-message')).toHaveTextContent('Lockout active - Press button to reset');
  });

  it('should not show lockout message when status is not locked', () => {
    render(<TimerDisplay time={180} status="idle" />);
    expect(screen.queryByTestId('lockout-message')).not.toBeInTheDocument();
  });

  it('should apply running state color', () => {
    render(<TimerDisplay time={180} status="running" />);
    const timerValue = screen.getByTestId('timer-value');
    expect(timerValue).toHaveClass('text-primary-600');
  });

  it('should apply locked state color', () => {
    render(<TimerDisplay time={0} status="locked" />);
    const timerValue = screen.getByTestId('timer-value');
    expect(timerValue).toHaveClass('text-red-500');
  });

  it('should apply idle state color', () => {
    render(<TimerDisplay time={180} status="idle" />);
    const timerValue = screen.getByTestId('timer-value');
    expect(timerValue).toHaveClass('text-secondary-700');
  });

  it('should show milliseconds when showMilliseconds is true', () => {
    render(<TimerDisplay time={180.5} status="idle" showMilliseconds={true} />);
    expect(screen.getByTestId('timer-value')).toHaveTextContent('3:00.500');
  });

  it('should not show milliseconds by default', () => {
    render(<TimerDisplay time={180.5} status="idle" />);
    expect(screen.getByTestId('timer-value')).toHaveTextContent('3:00');
  });

  it('should handle negative time gracefully', () => {
    render(<TimerDisplay time={-10} status="idle" />);
    expect(screen.getByTestId('timer-value')).toHaveTextContent('00:00');
  });

  it('should handle NaN time gracefully', () => {
    render(<TimerDisplay time={NaN} status="idle" />);
    expect(screen.getByTestId('timer-value')).toHaveTextContent('00:00');
  });

  it('should have correct role and aria attributes', () => {
    render(<TimerDisplay time={180} status="idle" />);
    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveAttribute('aria-live', 'polite');
    expect(timer).toHaveAttribute('aria-atomic', 'true');
  });
});
