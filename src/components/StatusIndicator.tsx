import React from 'react';
import type { TimerStatus } from '@/types';

interface StatusIndicatorProps {
  status: TimerStatus;
  className?: string;
}

/**
 * Status indicator showing current timer state
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  className = '',
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'idle':
        return {
          label: 'Ready',
          color: 'secondary',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          description: 'Timer is ready to start',
        };
      case 'running':
        return {
          label: 'Running',
          color: 'primary',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          description: 'Timer is counting down',
        };
      case 'locked':
        return {
          label: 'Locked',
          color: 'red',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
          description: '3-minute lockout active',
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'green',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          description: 'Timer completed',
        };
      default:
        return {
          label: 'Unknown',
          color: 'secondary',
          icon: null,
          description: 'Unknown status',
        };
    }
  };

  const { label, color, icon, description } = getStatusInfo();

  const colorClasses = {
    primary: 'bg-primary-100 text-primary-800 border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 border-secondary-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    green: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${colorClasses[color]} ${className}`}
      role="status"
      aria-label={description}
      data-testid="status-indicator"
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-secondary-600 hidden sm:block">{description}</p>
      </div>
    </div>
  );
};

export default StatusIndicator;
