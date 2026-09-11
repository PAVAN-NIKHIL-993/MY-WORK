import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Loading spinner component with accessibility support
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label = 'Loading',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className="flex items-center justify-center gap-3"
      role="status"
      aria-label={label}
    >
      <svg
        className={`animate-spin rounded-full border-primary-200 border-t-primary-600 ${sizeClasses[size]} ${className}`}
        viewBox="0 0 24 24"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
