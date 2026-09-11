import React from 'react';
import { formatTime } from '@/utils/formatTime';
import type { TimerDisplayProps } from '@/types';

/**
 * Timer display component showing formatted time
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  time,
  status,
  showMilliseconds = false,
}) => {
  const formattedTime = formatTime(time, showMilliseconds);

  // Determine text color based on status
  const getTextColor = () => {
    switch (status) {
      case 'running':
        return 'text-primary-600';
      case 'locked':
        return 'text-red-500';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-secondary-700';
    }
  };

  // Determine pulse animation for running state
  const shouldPulse = status === 'running';

  return (
    <div
      className={`text-center ${shouldPulse ? 'animate-pulse-soft' : ''}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className={`text-6xl md:text-7xl font-mono font-bold ${getTextColor()} transition-colors duration-200`}
        data-testid="timer-value"
      >
        {formattedTime}
      </span>
      {status === 'locked' && (
        <p className="mt-2 text-sm text-secondary-500" data-testid="lockout-message">
          Lockout active - Press button to reset
        </p>
      )}
    </div>
  );
};

export default TimerDisplay;
