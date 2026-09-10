import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

interface SkeletonComponent extends React.FC<SkeletonProps> {
  Card: React.FC<{ className?: string }>;
  Button: React.FC<{ className?: string }>;
}

/**
 * Skeleton loading component for content placeholders
 */
const Skeleton: SkeletonComponent = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const baseClasses = 'bg-secondary-200 rounded animate-pulse';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const style = {
    width: width || (variant === 'circular' ? height : '100%'),
    height: height || (variant === 'text' ? undefined : '100%'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
      data-testid="skeleton"
    />
  );
};

// Skeleton for Card content
Skeleton.Card = function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-6 ${className}`} data-testid="skeleton-card">
      <Skeleton className="mb-4" height={24} width={200} />
      <Skeleton className="mb-2" height={20} width="100%" />
      <Skeleton className="mb-2" height={20} width="80%" />
      <Skeleton height={20} width="60%" />
    </div>
  );
};

// Skeleton for Button
Skeleton.Button = function SkeletonButton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center px-6 py-3 rounded-lg bg-secondary-200 animate-pulse ${className}`}
      style={{ width: 200, height: 48 }}
      data-testid="skeleton-button"
    />
  );
};

export default Skeleton;
